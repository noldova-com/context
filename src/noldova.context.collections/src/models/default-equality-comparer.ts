/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";

export class DefaultEqualityComparer implements IEqualityComparer<unknown> {
  private static readonly OFFSET_BASIS: number = 0x811c9dc5;
  private static readonly PRIME: number = 0x01000193;
  private readonly objectIds: WeakMap<object, number> = new WeakMap<object, number>();
  private lastObjectId: number = 0;

  public equals(left: unknown, right: unknown): boolean {
    return left === right || Number.isNaN(left) && Number.isNaN(right);
  }

  public hash(value: unknown): number {
    if (Object.isObject(value))
      return this.objectIdOf(value);

    const text = String(value);
    let hash = DefaultEqualityComparer.OFFSET_BASIS;
    for (let index = 0; index < text.length; index++)
      hash = Math.imul(hash ^ text.charCodeAt(index), DefaultEqualityComparer.PRIME);

    return hash >>> 0;
  }

  private objectIdOf(value: object): number {
    let id = this.objectIds.get(value);
    if (Object.isUndefined(id)) {
      id = ++this.lastObjectId;
      this.objectIds.set(value, id);
    }

    return id;
  }
}
