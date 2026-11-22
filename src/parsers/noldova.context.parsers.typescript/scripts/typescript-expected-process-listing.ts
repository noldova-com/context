/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptExpectedProcessListing {
  public readonly file: string;
  public readonly arguments: readonly string[];
  public readonly script: string | undefined;
  public readonly bytesPerUnit: number;

  public constructor(file: string, arguments_: readonly string[], script: string | undefined, bytesPerUnit: number) {
    this.file = file;
    this.arguments = arguments_;
    this.script = script;
    this.bytesPerUnit = bytesPerUnit;
  }
}
