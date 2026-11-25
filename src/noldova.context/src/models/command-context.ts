/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CommandOutput } from "./command-output.js";

export class CommandContext {
  public readonly projectFilePath: string;
  public readonly arguments: readonly string[];
  public readonly output: CommandOutput;

  public constructor(projectFilePath: string, arguments_: readonly string[], output: CommandOutput) {
    this.projectFilePath = projectFilePath;
    this.arguments = arguments_;
    this.output = output;
  }
}
