/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommandOutput } from "@noldova/context";

export class RecordingOutput extends CommandOutput {
  public readonly lines: string[] = [];
  public readonly errorLines: string[] = [];

  public override writeLine(text: string): void {
    this.lines.push(text);
  }

  public override writeErrorLine(text: string): void {
    this.errorLines.push(text);
  }
}
