/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Enumerable } from "../models/enumerable.js";

export interface IReadOnlyList<T extends {} | null> extends Enumerable<T> {
  get(index: number): T;
  tryGet(index: number): T | undefined;
  indexOf(item: T): number;
}
