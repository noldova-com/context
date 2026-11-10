/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class CommandResult {
  public readonly command: string;
  public readonly count: number | null;

  public constructor(command: string, count: number | null) {
    this.command = command;
    this.count = count;
  }
}
