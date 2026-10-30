/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RegexUnicodeEscapeValue {
  public readonly codePoint: number;
  public readonly value: string;

  public constructor(value: string, codePoint: number) {
    this.value = value;
    this.codePoint = codePoint;
  }
}
