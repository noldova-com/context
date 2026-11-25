/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ProcessSignals } from "./process-signals.js";

export class ProcessListing {
  public readonly file: string;
  public readonly arguments: readonly string[];
  public readonly scriptFileName: string;
  public readonly script: string;
  public readonly signals: ProcessSignals;
  public readonly freezeRounds: number;
  public readonly readyMilliseconds: number;

  public constructor(
    file: string,
    arguments_: readonly string[],
    scriptFileName: string,
    script: string,
    signals: ProcessSignals,
    freezeRounds: number,
    readyMilliseconds: number) {
    this.file = file;
    this.arguments = arguments_;
    this.scriptFileName = scriptFileName;
    this.script = script;
    this.signals = signals;
    this.freezeRounds = freezeRounds;
    this.readyMilliseconds = readyMilliseconds;
  }
}
