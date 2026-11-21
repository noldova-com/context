/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";

export class KeyEqualityComparer<T, TKey> implements IEqualityComparer<T> {
  private readonly key: (item: T) => TKey;
  private readonly comparer: IEqualityComparer<TKey>;

  public constructor(key: (item: T) => TKey, comparer: IEqualityComparer<TKey>) {
    this.key = key;
    this.comparer = comparer;
  }

  public equals(left: T, right: T): boolean {
    return this.comparer.equals(this.key(left), this.key(right));
  }

  public hash(value: T): number {
    return this.comparer.hash(this.key(value));
  }
}
