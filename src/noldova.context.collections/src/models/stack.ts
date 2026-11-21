/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { InvalidOperationException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import { ChangeCounter } from "./change-counter.js";
import { Enumerable } from "./enumerable.js";

export class Stack<T extends {} | null> extends Enumerable<T> {
  private readonly changes: ChangeCounter = new ChangeCounter();
  private readonly items: T[];

  public constructor(items: Iterable<T> = []) {
    super();

    this.items = Array.from(items);
  }

  public override *[Symbol.iterator](): Generator<T> {
    const version = this.changes.value;
    for (const item of this.items.toReversed()) {
      yield item;
      this.changes.throwIfChangedSince(version);
    }
  }

  public override count(predicate?: (item: T) => boolean): number {
    return Object.isUndefined(predicate) ? this.items.length : super.count(predicate);
  }

  public push(item: T): void {
    this.items.push(item);
    this.changes.increment();
  }

  public pop(): T {
    const item = this.peek();
    this.items.pop();
    this.changes.increment();

    return item;
  }

  public tryPop(): T | undefined {
    return this.items.length === 0 ? undefined : this.pop();
  }

  public peek(): T {
    const item = this.items.at(-1);
    if (Object.isUndefined(item))
      throw new InvalidOperationException(Resources.collectionEmpty);

    return item;
  }

  public tryPeek(): T | undefined {
    return this.items.at(-1);
  }

  public clear(): void {
    this.items.length = 0;
    this.changes.increment();
  }
}
