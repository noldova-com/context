/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Resources } from "../resources.js";
import { CommandOutput } from "./command-output.js";

export class ConsoleOutput extends CommandOutput {
  public override writeLine(text: string): void {
    process.stdout.write(`${text}${Resources.lineSeparator}`);
  }

  public override writeErrorLine(text: string): void {
    process.stderr.write(`${text}${Resources.lineSeparator}`);
  }
}
