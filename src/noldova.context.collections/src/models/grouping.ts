/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Enumerable } from "./enumerable.js";

export class Grouping<TKey, T> extends Enumerable<T> {
  public readonly key: TKey;
  private readonly items: readonly T[];

  public constructor(key: TKey, items: readonly T[]) {
    super();

    this.key = key;
    this.items = items;
  }

  public override [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
}
