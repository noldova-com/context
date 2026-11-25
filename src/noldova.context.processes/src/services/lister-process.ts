/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { type ChildProcessByStdio, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

import "@noldova/context.core";

import { Enumerable, type IReadOnlyList } from "@noldova/context.collections";

import { ProcessesException } from "../exceptions/processes.exception.js";
import { ProcessEntry } from "../models/process-entry.js";
import type { ProcessListing } from "../models/process-listing.js";
import { Resources } from "../resources.js";

export class ListerProcess {
  private readonly listing: ProcessListing;
  private readonly child: ChildProcessByStdio<Writable, Readable, null>;
  private readonly ended: Promise<never>;
  private answer: PromiseWithResolvers<readonly string[]>;
  private lines: string[];
  private turn: Promise<unknown>;

  private constructor(child: ChildProcessByStdio<Writable, Readable, null>, listing: ProcessListing, onEnded: () => void) {
    this.listing = listing;
    this.child = child;
    this.answer = Promise.withResolvers<readonly string[]>();
    this.lines = [];
    this.turn = Promise.resolve();
    this.ended = once(child, Resources.closeEvent).then(() => {
      onEnded();
      throw new ProcessesException(Resources.formatListerEnded(listing.file));
    });
    this.ended.catch(() => undefined);
    void once(child.stdin, Resources.errorEvent);
    createInterface({ input: child.stdout }).on(Resources.lineEvent, (line: string) => this.receive(line));
  }

  public static async startAsync(listing: ProcessListing, onEnded: () => void): Promise<ListerProcess> {
    const folder = await mkdtemp(join(tmpdir(), Resources.listerFolderPrefix));
    try {
      const script = join(folder, listing.scriptFileName);
      await writeFile(script, listing.script, Resources.textEncoding);
      const child = spawn(listing.file, [...listing.arguments, script],
        { env: { ...process.env, ...Resources.listingEnvironment }, stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
      const lister = new ListerProcess(child, listing, onEnded);
      try {
        await lister.waitReadyAsync();
      }
      catch (exception) {
        lister.stop();
        await Promise.allSettled([lister.ended]);
        throw exception;
      }

      child.unref();
      for (const stream of [child.stdin, child.stdout])
        if (stream instanceof Socket)
          stream.unref();

      return lister;
    }
    finally {
      await rm(folder, { recursive: true, force: true, maxRetries: Resources.removalRetries });
    }
  }

  public listAsync(): Promise<IReadOnlyList<ProcessEntry>> {
    const listed = this.turn.then(() => this.listOnceAsync());
    this.turn = listed.catch(() => undefined);
    return listed;
  }

  public stop(): void {
    this.child.kill();
  }

  private async waitReadyAsync(): Promise<void> {
    const late = Promise.withResolvers<boolean>();
    const timer = setTimeout(() => late.resolve(false), this.listing.readyMilliseconds);
    const isReady = await Promise.race([this.waitAsync().then(() => true), late.promise]).finally(() => clearTimeout(timer));
    if (!isReady)
      throw new ProcessesException(Resources.formatListerNotReady(this.listing.file, this.listing.readyMilliseconds));
  }

  private async listOnceAsync(): Promise<IReadOnlyList<ProcessEntry>> {
    this.answer = Promise.withResolvers<readonly string[]>();
    this.child.stdin.write(Resources.lineSeparator);
    const lines = await this.waitAsync();
    return Enumerable.from(lines).select(t => ProcessEntry.parse(t)).where(t => t.processId !== this.child.pid && t.parentId !== this.child.pid).toList();
  }

  private waitAsync(): Promise<readonly string[]> {
    return Promise.race([this.answer.promise, this.ended]);
  }

  private receive(line: string): void {
    const text = line.trim();
    if (text.startsWith(Resources.refusedPrefix)) {
      this.answer.reject(new ProcessesException(Resources.formatListerRefused(this.listing.file, text.slice(Resources.refusedPrefix.length))));
      return;
    }

    if (text !== Resources.endLine) {
      this.lines.push(text);
      return;
    }

    const lines = this.lines;
    this.lines = [];
    this.answer.resolve(lines);
  }
}
