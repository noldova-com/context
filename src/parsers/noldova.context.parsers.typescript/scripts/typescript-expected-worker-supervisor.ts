/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChildProcess, spawn, spawnSync, type StdioNull, type StdioPipe } from "node:child_process";
import readline from "node:readline";

import "@noldova/context.core";

import type TypeScriptExpectedProcessMemory from "./typescript-expected-process-memory.ts";
import type TypeScriptExpectedRecord from "./typescript-expected-record.ts";
import TypeScriptExpectedWorkerEvent from "./typescript-expected-worker-event.ts";
import TypeScriptExpectedWorkerOutcome from "./typescript-expected-worker-outcome.ts";
import TypeScriptScriptException from "./typescript-script.exception.ts";

export default class TypeScriptExpectedWorkerSupervisor {
  private static readonly CLOSE_EVENT: string = "close";
  private static readonly ERROR_EVENT: string = "error";
  private static readonly EXIT_EVENT: string = "exit";
  private static readonly KILL_CONFIRMATION_MILLISECONDS: number = 5_000;
  private static readonly KILL_SIGNAL: NodeJS.Signals = "SIGKILL";
  private static readonly LINE_EVENT: string = "line";
  private static readonly MEMORY_POLL_MILLISECONDS: number = 250;
  private static readonly STDIO: [StdioNull, StdioPipe, StdioNull] = ["ignore", "pipe", "inherit"];
  private static readonly TEXT_ENCODING: BufferEncoding = "utf8";
  private static readonly WINDOWS_KILL_COMMAND: string = "taskkill";
  private static readonly WINDOWS_KILL_FORCE_OPTION: string = "/F";
  private static readonly WINDOWS_KILL_PROCESS_OPTION: string = "/PID";
  private static readonly WINDOWS_KILL_TREE_OPTION: string = "/T";
  private static readonly WINDOWS_PLATFORM: NodeJS.Platform = "win32";

  private readonly workerPath: string;
  private readonly batchPath: string;
  private readonly caseTimeoutMilliseconds: number;
  private readonly memoryBudgetBytes: number;
  private readonly memory: TypeScriptExpectedProcessMemory;
  private child: ChildProcess | undefined;
  private inFlightPath: string | undefined;
  private killedPath: string | undefined;
  private killReason: string | undefined;
  private caseTimer: NodeJS.Timeout | undefined;
  private memoryTimer: NodeJS.Timeout | undefined;
  private killConfirmationTimer: NodeJS.Timeout | undefined;
  private hasExited: boolean = false;

  public constructor(workerPath: string, batchPath: string, caseTimeoutMilliseconds: number, memoryBudgetBytes: number,
    memory: TypeScriptExpectedProcessMemory) {
    this.workerPath = workerPath;
    this.batchPath = batchPath;
    this.caseTimeoutMilliseconds = caseTimeoutMilliseconds;
    this.memoryBudgetBytes = memoryBudgetBytes;
    this.memory = memory;
  }

  public runAsync(onResult: (record: TypeScriptExpectedRecord) => void): Promise<TypeScriptExpectedWorkerOutcome> {
    return new Promise((resolve, reject) => {
      const fail = (error: unknown): void => {
        this.stopTimers();
        reject(error);
      };

      const isWindows = process.platform === TypeScriptExpectedWorkerSupervisor.WINDOWS_PLATFORM;
      const child = spawn(process.execPath, [this.workerPath, this.batchPath], {
        stdio: TypeScriptExpectedWorkerSupervisor.STDIO,
        detached: !isWindows,
      });
      this.child = child;

      let isReading = false;
      this.memoryTimer = setInterval(() => {
        const processId = child.pid;
        if (isReading || Object.isUndefined(processId))
          return;

        isReading = true;
        this.memory.readTreeBytesAsync(processId).then(t => {
          isReading = false;
          if (!this.hasExited && t > this.memoryBudgetBytes)
            this.kill(TypeScriptExpectedWorkerOutcome.MEMORY_REASON, fail);
        }, (error: unknown) => {
          if (this.hasExited)
            return;

          fail(error);
          this.kill(TypeScriptExpectedWorkerOutcome.MEMORY_REASON, fail);
        });
      }, TypeScriptExpectedWorkerSupervisor.MEMORY_POLL_MILLISECONDS);

      readline.createInterface({ input: child.stdout }).on(TypeScriptExpectedWorkerSupervisor.LINE_EVENT, t => {
        if (!Object.isUndefined(this.killReason))
          return;

        const event = TypeScriptExpectedWorkerEvent.parse(t);
        if (Object.isUndefined(event.record)) {
          this.inFlightPath = event.path;
          this.restartCaseTimer(fail);
        }
        else {
          this.inFlightPath = undefined;
          this.clearCaseTimer();
          onResult(event.record);
        }
      });

      child.on(TypeScriptExpectedWorkerSupervisor.ERROR_EVENT, fail);

      child.on(TypeScriptExpectedWorkerSupervisor.EXIT_EVENT, () => { this.hasExited = true; });

      child.on(TypeScriptExpectedWorkerSupervisor.CLOSE_EVENT, (exitCode, signal) => {
        this.stopTimers();
        resolve(this.outcome(exitCode, signal));
      });
    });
  }

  private outcome(exitCode: number | null, signal: NodeJS.Signals | null): TypeScriptExpectedWorkerOutcome {
    if (!Object.isUndefined(this.killReason))
      return new TypeScriptExpectedWorkerOutcome(exitCode, signal, this.killedPath, this.killReason);

    if (exitCode !== 0)
      return new TypeScriptExpectedWorkerOutcome(exitCode, signal, this.inFlightPath, TypeScriptExpectedWorkerOutcome.DEATH_REASON);

    return new TypeScriptExpectedWorkerOutcome(exitCode, signal, undefined, undefined);
  }

  private restartCaseTimer(fail: (error: unknown) => void): void {
    this.clearCaseTimer();
    this.caseTimer = setTimeout(() => { this.kill(TypeScriptExpectedWorkerOutcome.TIMEOUT_REASON, fail); }, this.caseTimeoutMilliseconds);
  }

  private clearCaseTimer(): void {
    if (!Object.isUndefined(this.caseTimer))
      clearTimeout(this.caseTimer);
    this.caseTimer = undefined;
  }

  private stopTimers(): void {
    clearInterval(this.memoryTimer);
    this.clearCaseTimer();
    clearTimeout(this.killConfirmationTimer);
  }

  private kill(reason: string, fail: (error: unknown) => void): void {
    const processId = this.child?.pid;
    if (!Object.isUndefined(this.killReason) || this.hasExited || Object.isUndefined(processId))
      return;

    this.killReason = reason;
    this.killedPath = this.inFlightPath;
    if (process.platform !== TypeScriptExpectedWorkerSupervisor.WINDOWS_PLATFORM) {
      process.kill(-processId, TypeScriptExpectedWorkerSupervisor.KILL_SIGNAL);
      return;
    }

    const result = spawnSync(TypeScriptExpectedWorkerSupervisor.WINDOWS_KILL_COMMAND, [
      TypeScriptExpectedWorkerSupervisor.WINDOWS_KILL_PROCESS_OPTION, String(processId),
      TypeScriptExpectedWorkerSupervisor.WINDOWS_KILL_TREE_OPTION, TypeScriptExpectedWorkerSupervisor.WINDOWS_KILL_FORCE_OPTION,
    ], { encoding: TypeScriptExpectedWorkerSupervisor.TEXT_ENCODING });
    if (!Object.isUndefined(result.error))
      fail(result.error);
    else if (result.status !== 0) {
      const report = `${result.stdout}${result.stderr}`.trim();
      this.killConfirmationTimer = setTimeout(() => { fail(new TypeScriptScriptException(TypeScriptExpectedWorkerSupervisor.killUnconfirmed(processId, reason, report))); },
        TypeScriptExpectedWorkerSupervisor.KILL_CONFIRMATION_MILLISECONDS);
    }
  }

  private static killUnconfirmed(processId: number, reason: string, report: string): string {
    return `The worker ${processId} was killed for ${reason} but has not ended; ${TypeScriptExpectedWorkerSupervisor.WINDOWS_KILL_COMMAND} reported: ${report}`;
  }
}
