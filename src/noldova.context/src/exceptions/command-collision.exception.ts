/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { CommandHostException } from "./command-host.exception.js";

export class CommandCollisionException extends CommandHostException {
  public readonly commandName: string;
  public readonly firstProvider: string;
  public readonly secondProvider: string;

  public constructor(commandName: string, firstProvider: string, secondProvider: string) {
    super(Resources.formatCommandCollision(commandName, firstProvider, secondProvider));

    this.commandName = commandName;
    this.firstProvider = firstProvider;
    this.secondProvider = secondProvider;
  }
}
