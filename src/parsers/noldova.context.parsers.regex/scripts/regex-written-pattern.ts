/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class RegexWrittenPattern {
  public readonly start: number;
  public readonly pattern: string;
  public readonly flags: string;

  public constructor(start: number, pattern: string, flags: string) {
    this.start = start;
    this.pattern = pattern;
    this.flags = flags;
  }
}
