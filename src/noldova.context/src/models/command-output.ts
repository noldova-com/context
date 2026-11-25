/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export abstract class CommandOutput {
  public abstract writeLine(text: string): void;
  public abstract writeErrorLine(text: string): void;
}
