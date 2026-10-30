/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default abstract class TypeScriptExpectedRecord {
  public readonly path: string;
  public readonly sha256: string;

  protected constructor(path: string, sha256: string) {
    this.path = path;
    this.sha256 = sha256;
  }
}
