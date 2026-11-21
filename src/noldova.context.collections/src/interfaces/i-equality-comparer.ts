/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface IEqualityComparer<T> {
  equals(left: T, right: T): boolean;
  hash(value: T): number;
}
