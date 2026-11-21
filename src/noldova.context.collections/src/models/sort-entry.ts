/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class SortEntry<T, TKey> {
  public readonly item: T;
  public readonly key: TKey;

  public constructor(item: T, key: TKey) {
    this.item = item;
    this.key = key;
  }
}
