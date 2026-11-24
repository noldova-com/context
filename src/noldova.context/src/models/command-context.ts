/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CommandOutput } from "./command-output.js";
import type { Project } from "./project.js";

export class CommandContext {
  public readonly project: Project;
  public readonly arguments: readonly string[];
  public readonly output: CommandOutput;

  public constructor(project: Project, arguments_: readonly string[], output: CommandOutput) {
    this.project = project;
    this.arguments = arguments_;
    this.output = output;
  }
}
