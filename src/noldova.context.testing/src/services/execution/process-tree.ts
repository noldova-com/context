/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { type ChildProcessByStdio, execFile, spawn } from "node:child_process";
import { Socket } from "node:net";
import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { TestingException } from "../../exceptions/testing.exception.js";
import type { IClock } from "../../interfaces/i-clock.js";
import type { ProcessListing } from "../../models/execution/process-listing.js";
import { Resources } from "../../resources.js";
import { SystemClock } from "../timing/system-clock.js";

export class ProcessTree {
  private readonly platform: string;
  private readonly listing: ProcessListing | undefined;
  private readonly clock: IClock;
  private lister: ChildProcessByStdio<Writable, Readable, null> | undefined;
  private listerClosed: Promise<void>;
  private warmingValue: Promise<boolean>;
  private isListerUsable: boolean;
  private answer: ((lines: string[] | undefined) => void) | undefined;
  private answerLines: string[];

  public constructor(platform: string, listings: ReadonlyMap<string, ProcessListing> = Resources.processListings, clock: IClock = new SystemClock()) {
    this.platform = platform;
    this.listing = listings.get(platform);
    this.clock = clock;
    this.lister = undefined;
    this.listerClosed = Promise.resolve();
    this.warmingValue = Promise.resolve(false);
    this.isListerUsable = false;
    this.answer = undefined;
    this.answerLines = [];
  }

  public get warming(): Promise<boolean> {
    return this.warmingValue;
  }

  public static end(processIds: readonly number[]): number {
    return processIds.filter(t => ProcessTree.tryEnd(t)).length;
  }

  public warm(): void {
    if (!Object.isUndefined(this.lister) || Object.isUndefined(this.listing))
      return;

    const lister = spawn(this.listing.warmFile, this.listing.warmArguments, { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    this.lister = lister;
    lister.unref();
    for (const stream of [lister.stdin, lister.stdout])
      if (stream instanceof Socket)
        stream.unref();

    const warmed = Promise.withResolvers<boolean>();
    this.warmingValue = warmed.promise;
    this.listerClosed = new Promise<void>(resolve => lister.once(Resources.closeEvent, () => resolve()));
    const lose = (): void => {
      this.isListerUsable = false;
      warmed.resolve(false);
      this.settleAnswer(undefined);
    };
    lister.once(Resources.closeEvent, lose);
    lister.on(Resources.errorEvent, lose);
    lister.stdin.on(Resources.errorEvent, lose);
    createInterface({ input: lister.stdout }).on(Resources.lineEvent, (line: string) => {
      const text = line.trim();
      if (text === Resources.listerReadyLine) {
        this.isListerUsable = true;
        warmed.resolve(true);
      }
      else if (text === Resources.listerEndLine)
        this.settleAnswer(this.answerLines);
      else
        this.answerLines.push(text);
    });
  }

  public async listDescendantsAsync(rootProcessId: number): Promise<number[]> {
    const links = await this.listWarmLinksAsync() ?? await this.listLinksAsync();
    const processIds: number[] = [];
    ProcessTree.collectLeavesFirst(links, rootProcessId, processIds);
    return processIds;
  }

  public async closeAsync(): Promise<void> {
    this.isListerUsable = false;
    this.lister?.ref();
    this.lister?.stdin.end();
    this.lister?.kill();
    await this.listerClosed;
  }

  private static tryEnd(processId: number): boolean {
    try {
      process.kill(processId, Resources.killSignal);
      return true;
    }
    catch {
      return false;
    }
  }

  private static collectLeavesFirst(links: readonly (readonly [number, number])[], parentId: number, processIds: number[]): void {
    for (const [processId] of links.filter(t => t[1] === parentId)) {
      ProcessTree.collectLeavesFirst(links, processId, processIds);
      processIds.push(processId);
    }
  }

  private static parseLinks(lines: readonly string[], listerProcessIds: readonly (number | undefined)[]): (readonly [number, number])[] {
    return lines
      .map(t => t.trim().split(/\s+/u))
      .filter(t => t.length === 2)
      .map((t): readonly [number, number] => [Number(t[0]), Number(t[1])])
      .filter(t => !listerProcessIds.includes(t[0]));
  }

  private settleAnswer(lines: string[] | undefined): void {
    const answer = this.answer;
    this.answer = undefined;
    this.answerLines = [];
    answer?.(lines);
  }

  private listWarmLinksAsync(): Promise<(readonly [number, number])[] | undefined> {
    const lister = this.lister;
    if (!this.isListerUsable || Object.isUndefined(lister))
      return Promise.resolve(undefined);

    return new Promise<(readonly [number, number])[] | undefined>(resolve => {
      const timer = this.clock.setTimeout(() => {
        this.isListerUsable = false;
        this.settleAnswer(undefined);
      }, Resources.warmListingMilliseconds);
      this.answer = lines => {
        this.clock.clearTimeout(timer);
        resolve(Object.isUndefined(lines) ? undefined : ProcessTree.parseLinks(lines, [lister.pid]));
      };
      lister.stdin.write(Resources.lineSeparator);
    });
  }

  private listLinksAsync(): Promise<(readonly [number, number])[]> {
    const listing = this.listing;
    if (Object.isUndefined(listing))
      return Promise.reject(new TestingException(Resources.processListingUnsupported(this.platform)));

    return new Promise<(readonly [number, number])[]>((resolve, reject) => {
      const lister = execFile(listing.file, listing.arguments, { encoding: Resources.textEncoding, windowsHide: true }, (error, output) => {
        if (Object.isNull(error))
          resolve(ProcessTree.parseLinks(output.split(Resources.lineSeparator), [lister.pid, this.lister?.pid]));
        else
          reject(new TestingException(Resources.processListingFailed(listing.file), new ExceptionOptions(error)));
      });
    });
  }
}
