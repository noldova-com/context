/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class BuiltQuery {
  public readonly text: string;
  public readonly values: readonly unknown[];
  public readonly oids: readonly number[];

  public constructor(text: string, values: readonly unknown[], oids: readonly number[]) {
    this.text = text;
    this.values = values;
    this.oids = oids;
  }
}
