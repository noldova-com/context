/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ArrayElement {
  public readonly type: number;
  public readonly delimiter: string;

  public constructor(type: number, delimiter: string) {
    this.type = type;
    this.delimiter = delimiter;
  }
}
