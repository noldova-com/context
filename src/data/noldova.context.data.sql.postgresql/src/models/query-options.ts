/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class QueryOptions {
  public simple: boolean;
  public prepare: boolean | null;

  public constructor(simple: boolean = false, prepare: boolean | null = null) {
    this.simple = simple;
    this.prepare = prepare;
  }
}
