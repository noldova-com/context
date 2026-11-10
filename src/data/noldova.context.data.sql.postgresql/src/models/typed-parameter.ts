/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class TypedParameter {
  public readonly value: unknown;
  public readonly type: number | string;

  public constructor(value: unknown, type: number | string) {
    this.value = value;
    this.type = type;
  }
}
