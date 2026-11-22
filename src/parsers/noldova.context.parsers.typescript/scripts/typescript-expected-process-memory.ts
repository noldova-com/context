/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChildProcessByStdio, spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import type { Readable, Writable } from "node:stream";

import "@noldova/context.core";

import TypeScriptExpectedProcessListing from "./typescript-expected-process-listing.ts";
import TypeScriptExpectedProcessRow from "./typescript-expected-process-row.ts";
import TypeScriptScriptException from "./typescript-script.exception.ts";

export default class TypeScriptExpectedProcessMemory {
  public static readonly SCRIPT_ARGUMENT: string = "<listing script>";
  private static readonly CLOSE_EVENT: string = "close";
  private static readonly END_LINE: string = "end";
  private static readonly ERROR_EVENT: string = "error";
  private static readonly KIBIBYTE: number = 1024;
  private static readonly LINE_EVENT: string = "line";
  private static readonly LINE_FEED: string = "\n";
  private static readonly LISTER_ENDED: string = "The process lister ended, so the worker's memory can no longer be measured.";
  private static readonly READY_LINE: string = "ready";
  private static readonly SCRIPT_DIRECTORY_PREFIX: string = "noldova-process-memory-";
  private static readonly SCRIPT_FILE_NAME: string = "list-processes.js";
  private static readonly UNIX_LISTING: TypeScriptExpectedProcessListing = new TypeScriptExpectedProcessListing("sh", ["-c",
    `echo ${TypeScriptExpectedProcessMemory.READY_LINE}; ` +
    `while read -r line; do ps -A -o pid=,ppid=,rss=; echo ${TypeScriptExpectedProcessMemory.END_LINE}; done`],
  undefined, TypeScriptExpectedProcessMemory.KIBIBYTE);
  private static readonly WINDOWS_SCRIPT: string = "var newLine = String.fromCharCode(10); var service; " +
    "function list() { var all = [], created = {}, lines = []; " +
    "for (var items = new Enumerator(service.ExecQuery('SELECT ProcessId, ParentProcessId, CreationDate, WorkingSetSize FROM Win32_Process')); " +
    "!items.atEnd(); items.moveNext()) { var item = items.item(); " +
    "var row = { id: item.ProcessId, parent: item.ParentProcessId, created: item.CreationDate, bytes: item.WorkingSetSize }; " +
    "all.push(row); created[row.id] = row.created; } " +
    "for (var index = 0; index < all.length; index++) { var entry = all[index]; var parentCreated = created[entry.parent]; " +
    "var isChild = parentCreated != null && entry.created != null && parentCreated < entry.created; " +
    "lines.push(entry.id + ' ' + (isChild ? entry.parent : 0) + ' ' + entry.bytes + newLine); } return lines.join(''); } " +
    "try { service = new ActiveXObject('WbemScripting.SWbemLocator').ConnectServer(); " +
    `list(); WScript.StdOut.WriteLine('${TypeScriptExpectedProcessMemory.READY_LINE}'); ` +
    "while (!WScript.StdIn.AtEndOfStream) { WScript.StdIn.ReadLine(); " +
    `WScript.StdOut.Write(list()); WScript.StdOut.WriteLine('${TypeScriptExpectedProcessMemory.END_LINE}'); } } ` +
    "catch (error) { WScript.StdErr.WriteLine(error.message); WScript.Quit(1); }";
  private static readonly WINDOWS_LISTING: TypeScriptExpectedProcessListing = new TypeScriptExpectedProcessListing("cscript.exe",
    ["//nologo", "//B", "//E:jscript", TypeScriptExpectedProcessMemory.SCRIPT_ARGUMENT], TypeScriptExpectedProcessMemory.WINDOWS_SCRIPT, 1);
  private static readonly LISTINGS: ReadonlyMap<string, TypeScriptExpectedProcessListing> = new Map([
    ["darwin", TypeScriptExpectedProcessMemory.UNIX_LISTING],
    ["linux", TypeScriptExpectedProcessMemory.UNIX_LISTING],
    ["win32", TypeScriptExpectedProcessMemory.WINDOWS_LISTING],
  ]);

  private readonly lister: ChildProcessByStdio<Writable, Readable, null>;
  private readonly bytesPerUnit: number;
  private readonly scriptDirectory: string | undefined;
  private readonly closed: Promise<void>;
  private reading: Promise<void>;
  private isEnded: boolean;
  private answer: ((lines: readonly string[] | undefined) => void) | undefined;
  private answerLines: string[];

  private constructor(lister: ChildProcessByStdio<Writable, Readable, null>, bytesPerUnit: number, scriptDirectory: string | undefined) {
    this.lister = lister;
    this.bytesPerUnit = bytesPerUnit;
    this.scriptDirectory = scriptDirectory;
    this.closed = new Promise<void>(resolve => lister.once(TypeScriptExpectedProcessMemory.CLOSE_EVENT, () => { resolve(); }));
    this.reading = Promise.resolve();
    this.isEnded = false;
    this.answer = undefined;
    this.answerLines = [];
  }

  public static listingFor(platform: string): TypeScriptExpectedProcessListing {
    const listing = TypeScriptExpectedProcessMemory.LISTINGS.get(platform);
    if (Object.isUndefined(listing))
      throw new TypeScriptScriptException(TypeScriptExpectedProcessMemory.unsupported(platform));

    return listing;
  }

  public static startAsync(listing: TypeScriptExpectedProcessListing = TypeScriptExpectedProcessMemory.listingFor(process.platform)):
  Promise<TypeScriptExpectedProcessMemory> {
    let scriptDirectory: string | undefined;
    let arguments_ = listing.arguments;
    if (!Object.isUndefined(listing.script)) {
      scriptDirectory = mkdtempSync(path.join(tmpdir(), TypeScriptExpectedProcessMemory.SCRIPT_DIRECTORY_PREFIX));
      const scriptPath = path.join(scriptDirectory, TypeScriptExpectedProcessMemory.SCRIPT_FILE_NAME);
      writeFileSync(scriptPath, listing.script);
      arguments_ = arguments_.map(t => t === TypeScriptExpectedProcessMemory.SCRIPT_ARGUMENT ? scriptPath : t);
    }

    const lister = spawn(listing.file, arguments_, { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    const memory = new TypeScriptExpectedProcessMemory(lister, listing.bytesPerUnit, scriptDirectory);

    return new Promise((resolve, reject) => {
      let isReady = false;
      const end = (): void => {
        if (memory.isEnded)
          return;

        memory.isEnded = true;
        memory.settleAnswer(undefined);
        if (!isReady)
          memory.removeScriptAsync().then(() => { reject(new TypeScriptScriptException(TypeScriptExpectedProcessMemory.notReady(listing.file))); }, reject);
      };
      lister.once(TypeScriptExpectedProcessMemory.CLOSE_EVENT, end);
      lister.on(TypeScriptExpectedProcessMemory.ERROR_EVENT, end);
      lister.stdin.on(TypeScriptExpectedProcessMemory.ERROR_EVENT, end);
      readline.createInterface({ input: lister.stdout }).on(TypeScriptExpectedProcessMemory.LINE_EVENT, (line: string) => {
        const text = line.trim();
        if (text === TypeScriptExpectedProcessMemory.READY_LINE) {
          isReady = true;
          resolve(memory);
        }
        else if (text === TypeScriptExpectedProcessMemory.END_LINE)
          memory.settleAnswer(memory.answerLines);
        else
          memory.answerLines.push(text);
      });
    });
  }

  public readTreeBytesAsync(rootProcessId: number): Promise<number> {
    const reading = this.reading.then(() => this.listAsync()).then(t => this.sumTree(t, rootProcessId));
    this.reading = reading.then(() => undefined, () => undefined);

    return reading;
  }

  public async closeAsync(): Promise<void> {
    this.lister.stdin.end();
    this.lister.kill();
    await this.closed;
    await this.removeScriptAsync();
  }

  private listAsync(): Promise<readonly string[]> {
    return new Promise((resolve, reject) => {
      if (this.isEnded) {
        reject(new TypeScriptScriptException(TypeScriptExpectedProcessMemory.LISTER_ENDED));
        return;
      }

      this.answer = lines => {
        if (Object.isUndefined(lines))
          reject(new TypeScriptScriptException(TypeScriptExpectedProcessMemory.LISTER_ENDED));
        else
          resolve(lines);
      };
      this.lister.stdin.write(TypeScriptExpectedProcessMemory.LINE_FEED);
    });
  }

  private settleAnswer(lines: readonly string[] | undefined): void {
    const answer = this.answer;
    this.answer = undefined;
    this.answerLines = [];
    answer?.(lines);
  }

  private sumTree(lines: readonly string[], rootProcessId: number): number {
    const rows = lines.map(t => TypeScriptExpectedProcessRow.parse(t, this.bytesPerUnit)).filter(t => !Object.isUndefined(t));
    const tree = new Set([rootProcessId]);
    for (let isGrowing = true; isGrowing;) {
      isGrowing = false;
      for (const row of rows)
        if (!tree.has(row.processId) && tree.has(row.parentId)) {
          tree.add(row.processId);
          isGrowing = true;
        }
    }

    return rows.filter(t => tree.has(t.processId)).reduce((total, t) => total + t.bytes, 0);
  }

  private removeScriptAsync(): Promise<void> {
    return Object.isUndefined(this.scriptDirectory) ? Promise.resolve() : rm(this.scriptDirectory, { recursive: true, force: true });
  }

  private static notReady(file: string): string {
    return `The process lister ${file} ended before it was ready, so the worker's memory cannot be measured.`;
  }

  private static unsupported(platform: string): string {
    return `The worker's memory cannot be measured on ${platform}; the generator lists processes on darwin, linux and win32.`;
  }
}
