/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Enumerable } from "../models/enumerable.js";

export interface IReadOnlySet<T> extends Enumerable<T> {
  isSubsetOf(other: Iterable<T>): boolean;
  isSupersetOf(other: Iterable<T>): boolean;
  overlaps(other: Iterable<T>): boolean;
  setEquals(other: Iterable<T>): boolean;
}
