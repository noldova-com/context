/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptExpectedWorkerOutcome {
  public static readonly DEATH_REASON: string = "compiler death";
  public static readonly MEMORY_REASON: string = "memory";
  public static readonly TIMEOUT_REASON: string = "timeout";

  public readonly exitCode: number | null;
  public readonly signal: NodeJS.Signals | null;
  public readonly chargedPath: string | undefined;
  public readonly reason: string | undefined;

  public constructor(exitCode: number | null, signal: NodeJS.Signals | null, chargedPath: string | undefined, reason: string | undefined) {
    this.exitCode = exitCode;
    this.signal = signal;
    this.chargedPath = chargedPath;
    this.reason = reason;
  }
}
