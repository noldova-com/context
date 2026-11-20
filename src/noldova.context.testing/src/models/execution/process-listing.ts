/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ProcessListing {
  public readonly file: string;
  public readonly arguments: readonly string[];
  public readonly warmFile: string;
  public readonly warmArguments: readonly string[];
  public readonly script: string | undefined;

  public constructor(file: string, arguments_: readonly string[], warmFile: string, warmArguments: readonly string[], script: string | undefined = undefined) {
    this.file = file;
    this.arguments = arguments_;
    this.warmFile = warmFile;
    this.warmArguments = warmArguments;
    this.script = script;
  }
}
