/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class CompiledCopy {
  public readonly source: string;
  public readonly filePath: string;

  public constructor(source: string, filePath: string) {
    this.source = source;
    this.filePath = filePath;
  }
}
