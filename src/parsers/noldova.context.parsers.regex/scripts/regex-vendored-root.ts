/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class RegexVendoredRoot {
  public readonly upstreamRoot: string;
  public readonly localRoot: string;
  public readonly files: number;

  public constructor(upstreamRoot: string, localRoot: string, files: number = 0) {
    this.upstreamRoot = upstreamRoot;
    this.localRoot = localRoot;
    this.files = files;
  }

  public withFiles(files: number): RegexVendoredRoot {
    return new RegexVendoredRoot(this.upstreamRoot, this.localRoot, files);
  }
}
