/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "../interfaces/i-read-only-list.js";
import { Enumerable } from "./enumerable.js";

export class ReadOnlyList<T extends {} | null> extends Enumerable<T> implements IReadOnlyList<T> {
  private readonly list: IReadOnlyList<T>;

  public constructor(list: IReadOnlyList<T>) {
    super();

    this.list = list;
  }

  public override [Symbol.iterator](): Iterator<T> {
    return this.list[Symbol.iterator]();
  }

  public override count(predicate?: (item: T) => boolean): number {
    return this.list.count(predicate);
  }

  public get(index: number): T {
    return this.list.get(index);
  }

  public tryGet(index: number): T | undefined {
    return this.list.tryGet(index);
  }

  public indexOf(item: T): number {
    return this.list.indexOf(item);
  }
}
