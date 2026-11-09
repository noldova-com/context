/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class RowColumn {
  public readonly name: string;
  public readonly type: number;

  public constructor(name: string, type: number) {
    this.name = name;
    this.type = type;
  }
}
