/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { type ChildProcess, type ChildProcessByStdio, execFile, spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import { setImmediate } from "node:timers/promises";

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { TestingException } from "../../exceptions/testing.exception.js";
import type { IClock } from "../../interfaces/i-clock.js";
import { ProcessDescendants } from "../../models/execution/process-descendants.js";
import type { ProcessListing } from "../../models/execution/process-listing.js";
import { ProcessRow } from "../../models/execution/process-row.js";
import { Resources } from "../../resources.js";
import { SystemClock } from "../timing/system-clock.js";

export class ProcessTree {
  private readonly platform: string;
  private readonly listing: ProcessListing | undefined;
  private readonly clock: IClock;
  private lister: ChildProcessByStdio<Writable, Readable, null> | undefined;
  private readonly openListers: Map<Promise<void>, string>;
  private warmingValue: Promise<boolean>;
  private isListerUsable: boolean;
  private answer: ((lines: string[] | undefined) => void) | undefined;
  private answerLines: string[];
  private scriptDirectory: string | undefined;
  private scriptPath: string | undefined;

  public constructor(platform: string, listings: ReadonlyMap<string, ProcessListing> = Resources.processListings, clock: IClock = new SystemClock()) {
    this.platform = platform;
    this.listing = listings.get(platform);
    this.clock = clock;
    this.lister = undefined;
    this.openListers = new Map();
    this.warmingValue = Promise.resolve(false);
    this.isListerUsable = false;
    this.answer = undefined;
    this.answerLines = [];
    this.scriptDirectory = undefined;
    this.scriptPath = undefined;
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

    let warmArguments: readonly string[];
    try {
      warmArguments = this.withScript(this.listing.warmArguments);
    }
    catch {
      return;
    }

    const lister = spawn(this.listing.warmFile, warmArguments, { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    this.lister = lister;
    lister.unref();
    for (const stream of [lister.stdin, lister.stdout])
      if (stream instanceof Socket)
        stream.unref();

    const warmed = Promise.withResolvers<boolean>();
    this.warmingValue = warmed.promise;
    this.trackClose(lister, this.listing.warmFile);
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

  public async listDescendantsAsync(rootProcessId: number): Promise<ProcessDescendants> {
    const deadline = this.clock.now() + Resources.warmListingMilliseconds + Resources.oneOffListingMilliseconds;
    const incompleteListings: string[] = [];
    for (;;) {
      const warmStart = this.clock.now();
      const warmRows = await this.listWarmRowsAsync(deadline);
      const isWarm = !Object.isUndefined(warmRows);
      if (!isWarm && this.clock.now() >= deadline)
        throw new TestingException(Resources.processListingIncomplete(rootProcessId, incompleteListings));

      const start = isWarm ? warmStart : this.clock.now();
      const rows = warmRows ?? await this.listRowsAsync(deadline);
      const milliseconds = Math.round(this.clock.now() - start);
      const rowsById = new Map(rows.map(t => [t.processId, t]));
      if (rowsById.has(rootProcessId)) {
        const processIds: number[] = [];
        ProcessTree.collectLeavesFirst(rows, rowsById, rootProcessId, processIds);
        return new ProcessDescendants(processIds, isWarm, milliseconds, rows.length, ProcessTree.findBrokenChains(rows, rowsById, rootProcessId),
          incompleteListings);
      }

      incompleteListings.push(Resources.processListingNamed(isWarm ? Resources.warmListingKind : Resources.oneOffListingKind, milliseconds, rows.length));
      if (incompleteListings.length === Resources.listingTries || this.clock.now() + Resources.listingPauseMilliseconds >= deadline)
        throw new TestingException(Resources.processListingIncomplete(rootProcessId, incompleteListings));

      await new Promise<void>(resolve => this.clock.setTimeout(resolve, Resources.listingPauseMilliseconds));
    }
  }

  public async closeAsync(limitMilliseconds: number, reportFailure: (error: TestingException) => void): Promise<boolean> {
    this.isListerUsable = false;
    this.lister?.ref();
    this.lister?.stdin.end();
    this.lister?.kill();
    if (!await this.waitForListersAsync(limitMilliseconds)) {
      reportFailure(new TestingException(Resources.processListersNotEnded([...this.openListers.values()], limitMilliseconds)));
      return false;
    }

    await ProcessTree.waitForClosingHandlesAsync();
    if (!Object.isUndefined(this.scriptDirectory))
      await rm(this.scriptDirectory, { recursive: true, force: true, maxRetries: Resources.temporaryRemovalRetries });

    return true;
  }

  // A child's handle closes at the end of the event loop's turn in which the child closed, after its close event, so the second turn's
  // immediate is the first that no longer sees it.
  private static async waitForClosingHandlesAsync(): Promise<void> {
    await setImmediate();
    await setImmediate();
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

  private static collectLeavesFirst(rows: readonly ProcessRow[], rowsById: ReadonlyMap<number, ProcessRow>, parentId: number, processIds: number[]): void {
    for (const row of rows.filter(t => t.parentId === parentId && ProcessTree.isLinked(t, rowsById))) {
      ProcessTree.collectLeavesFirst(rows, rowsById, row.processId, processIds);
      processIds.push(row.processId);
    }
  }

  private static isLinked(row: ProcessRow, rowsById: ReadonlyMap<number, ProcessRow>): boolean {
    if (Object.isUndefined(row.created))
      return true;

    const parentCreated = rowsById.get(row.parentId)?.created;
    return !Object.isUndefined(parentCreated) && parentCreated < row.created;
  }

  private static findBrokenChains(rows: readonly ProcessRow[], rowsById: ReadonlyMap<number, ProcessRow>, rootProcessId: number): string[] | undefined {
    const rootCreated = rowsById.get(rootProcessId)?.created;
    if (Object.isUndefined(rootCreated))
      return undefined;

    return rows.filter(t => ProcessTree.isNewer(t, rootCreated)).flatMap(t => ProcessTree.findBrokenChain(t, rowsById, rootCreated));
  }

  private static findBrokenChain(row: ProcessRow, rowsById: ReadonlyMap<number, ProcessRow>, rootCreated: string): string[] {
    const chain = [row.processId];
    let current = row;
    let parent = rowsById.get(current.parentId);
    while (!Object.isUndefined(parent) && ProcessTree.isLinked(current, rowsById) && ProcessTree.isNewer(parent, rootCreated)) {
      chain.push(parent.processId);
      current = parent;
      parent = rowsById.get(current.parentId);
    }

    return Object.isUndefined(parent) || !ProcessTree.isLinked(current, rowsById) ? [Resources.brokenProcessChain(chain, current.parentId)] : [];
  }

  private static isNewer(row: ProcessRow, rootCreated: string): boolean {
    return !Object.isUndefined(row.created) && row.created > rootCreated;
  }

  private static parseRows(lines: readonly string[], listerProcessIds: readonly (number | undefined)[]): ProcessRow[] {
    return lines.flatMap(t => ProcessRow.parse(t) ?? []).filter(t => !listerProcessIds.includes(t.processId));
  }

  private withScript(arguments_: readonly string[]): readonly string[] {
    const script = this.listing?.script;
    if (Object.isUndefined(script))
      return arguments_;

    if (Object.isUndefined(this.scriptPath)) {
      this.scriptDirectory ??= mkdtempSync(join(tmpdir(), Resources.listingScriptDirectoryPrefix));
      const scriptPath = join(this.scriptDirectory, Resources.listingScriptFileName);
      writeFileSync(scriptPath, script);
      this.scriptPath = scriptPath;
    }

    const scriptPath = this.scriptPath;
    return arguments_.map(t => t === Resources.listingScriptArgument ? scriptPath : t);
  }

  private trackClose(child: ChildProcess, file: string): void {
    const closed = new Promise<void>(resolve => child.once(Resources.closeEvent, () => {
      this.openListers.delete(closed);
      resolve();
    }));
    this.openListers.set(closed, file);
  }

  private waitForListersAsync(limitMilliseconds: number): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const timer = this.clock.setTimeout(() => resolve(false), limitMilliseconds);
      void Promise.all(this.openListers.keys()).then(() => {
        this.clock.clearTimeout(timer);
        resolve(true);
      });
    });
  }

  private settleAnswer(lines: string[] | undefined): void {
    const answer = this.answer;
    this.answer = undefined;
    this.answerLines = [];
    answer?.(lines);
  }

  private listWarmRowsAsync(deadline: number): Promise<ProcessRow[] | undefined> {
    const lister = this.lister;
    if (!this.isListerUsable || Object.isUndefined(lister))
      return Promise.resolve(undefined);

    return new Promise<ProcessRow[] | undefined>(resolve => {
      const timer = this.clock.setTimeout(() => {
        this.isListerUsable = false;
        this.settleAnswer(undefined);
      }, Math.min(Resources.warmListingMilliseconds, deadline - this.clock.now()));
      this.answer = lines => {
        this.clock.clearTimeout(timer);
        resolve(Object.isUndefined(lines) ? undefined : ProcessTree.parseRows(lines, [lister.pid]));
      };
      lister.stdin.write(Resources.lineSeparator);
    });
  }

  private listRowsAsync(deadline: number): Promise<ProcessRow[]> {
    const listing = this.listing;
    if (Object.isUndefined(listing))
      return Promise.reject(new TestingException(Resources.processListingUnsupported(this.platform)));

    let arguments_: readonly string[];
    try {
      arguments_ = this.withScript(listing.arguments);
    }
    catch (error) {
      return Promise.reject(new TestingException(Resources.processListingFailed(listing.file), new ExceptionOptions(error)));
    }

    const limitMilliseconds = Math.min(Resources.oneOffListingMilliseconds, deadline - this.clock.now());
    return new Promise<ProcessRow[]>((resolve, reject) => {
      const lister = execFile(listing.file, arguments_, { encoding: Resources.textEncoding, windowsHide: true }, (error, output) => {
        this.clock.clearTimeout(timer);
        const lines = output.split(Resources.lineSeparator).map(t => t.trim());
        const endIndex = lines.indexOf(Resources.listerEndLine);
        if (!Object.isNull(error))
          reject(new TestingException(Resources.processListingFailed(listing.file), new ExceptionOptions(error)));
        else if (endIndex < 0)
          reject(new TestingException(Resources.processListingUnfinished(listing.file, output.trim())));
        else
          resolve(ProcessTree.parseRows(lines.slice(0, endIndex), [lister.pid, this.lister?.pid]));
      });
      this.trackClose(lister, listing.file);
      const timer = this.clock.setTimeout(() => {
        reject(new TestingException(Resources.processListingTimedOut(listing.file, limitMilliseconds)));
        lister.kill(Resources.killSignal);
      }, limitMilliseconds);
    });
  }
}
