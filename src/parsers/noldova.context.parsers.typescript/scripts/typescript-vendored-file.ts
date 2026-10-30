/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptVendoredFile {
  public readonly upstreamPath: string;
  public readonly localPath: string;

  public constructor(upstreamPath: string, localPath: string) {
    this.upstreamPath = upstreamPath;
    this.localPath = localPath;
  }
}
