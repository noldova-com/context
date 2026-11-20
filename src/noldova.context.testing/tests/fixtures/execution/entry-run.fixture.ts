/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class EntryRun {
  public readonly exitCode: number;
  public readonly errorOutput: string;
  public readonly output: string;
  public readonly processId: number;

  public constructor(exitCode: number, errorOutput: string, output: string, processId: number) {
    this.exitCode = exitCode;
    this.errorOutput = errorOutput;
    this.output = output;
    this.processId = processId;
  }
}
