/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RegexGroupName {
  public readonly value: string;
  public readonly isValid: boolean;

  public constructor(value: string, isValid: boolean) {
    this.value = value;
    this.isValid = isValid;
  }
}
