/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IEqualityComparer } from "../interfaces/i-equality-comparer.js";
import type { IReadOnlySet } from "../interfaces/i-read-only-set.js";
import { Enumerable } from "./enumerable.js";

export class ReadOnlySet<T> extends Enumerable<T> implements IReadOnlySet<T> {
  private readonly set: IReadOnlySet<T>;

  public constructor(set: IReadOnlySet<T>) {
    super();

    this.set = set;
  }

  public override [Symbol.iterator](): Iterator<T> {
    return this.set[Symbol.iterator]();
  }

  public override count(predicate?: (item: T) => boolean): number {
    return this.set.count(predicate);
  }

  public override contains(item: T, comparer?: IEqualityComparer<T>): boolean {
    return this.set.contains(item, comparer);
  }

  public isSubsetOf(other: Iterable<T>): boolean {
    return this.set.isSubsetOf(other);
  }

  public isSupersetOf(other: Iterable<T>): boolean {
    return this.set.isSupersetOf(other);
  }

  public overlaps(other: Iterable<T>): boolean {
    return this.set.overlaps(other);
  }

  public setEquals(other: Iterable<T>): boolean {
    return this.set.setEquals(other);
  }
}
