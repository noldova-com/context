/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class KeyValuePair<TKey, TValue> {
  public readonly key: TKey;
  public readonly value: TValue;

  public constructor(key: TKey, value: TValue) {
    this.key = key;
    this.value = value;
  }
}
