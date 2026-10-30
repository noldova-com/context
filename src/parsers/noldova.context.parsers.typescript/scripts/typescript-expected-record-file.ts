/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptExpectedRecordFile {
  public readonly name: string;
  public readonly sha256: string;

  public constructor(name: string, sha256: string) {
    this.name = name;
    this.sha256 = sha256;
  }
}
