/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";
import { DefaultEqualityComparer } from "../models/default-equality-comparer.js";
import { KeyEqualityComparer } from "../models/key-equality-comparer.js";

export class EqualityComparers {
  public static readonly default: DefaultEqualityComparer = new DefaultEqualityComparer();

  public static by<T, TKey>(key: (item: T) => TKey, comparer: IEqualityComparer<TKey> = EqualityComparers.default): KeyEqualityComparer<T, TKey> {
    return new KeyEqualityComparer<T, TKey>(key, comparer);
  }
}
