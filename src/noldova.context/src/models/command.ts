/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CommandContext } from "./command-context.js";

export abstract class Command {
  public abstract readonly name: string;
  public abstract readonly description: string;

  public abstract runAsync(context: CommandContext): Promise<number>;
}
