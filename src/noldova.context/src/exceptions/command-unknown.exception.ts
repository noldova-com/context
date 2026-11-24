/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resources } from "../resources.js";
import { CommandHostException } from "./command-host.exception.js";

export class CommandUnknownException extends CommandHostException {
  public readonly commandName: string;

  public constructor(commandName: string) {
    super(Resources.formatCommandUnknown(commandName));

    this.commandName = commandName;
  }
}
