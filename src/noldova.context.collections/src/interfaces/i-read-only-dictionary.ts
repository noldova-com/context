/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Enumerable } from "../models/enumerable.js";
import type { KeyValuePair } from "../models/key-value-pair.js";

export interface IReadOnlyDictionary<TKey, TValue extends {} | null> extends Enumerable<KeyValuePair<TKey, TValue>> {
  get(key: TKey): TValue;
  tryGet(key: TKey): TValue | undefined;
  containsKey(key: TKey): boolean;
  keys(): Enumerable<TKey>;
  values(): Enumerable<TValue>;
}
