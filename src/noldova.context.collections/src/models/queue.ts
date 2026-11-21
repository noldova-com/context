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

export class Queue<T extends {} | null> extends Enumerable<T> {
  private static readonly MINIMUM_CAPACITY: number = 4;

  private readonly changes: ChangeCounter = new ChangeCounter();
  private slots: (T | undefined)[] = [];
  private head: number = 0;
  private size: number = 0;

  public constructor(items: Iterable<T> = []) {
    super();

    for (const item of items)
      this.enqueue(item);
  }

  public override *[Symbol.iterator](): Generator<T> {
    const version = this.changes.value;
    const capacity = this.slots.length;
    for (let offset = 0; offset < capacity; offset++) {
      const item = this.slots[(this.head + offset) % capacity];
      if (!Object.isUndefined(item)) {
        yield item;
        this.changes.throwIfChangedSince(version);
      }
    }
  }

  public override count(predicate?: (item: T) => boolean): number {
    return Object.isUndefined(predicate) ? this.size : super.count(predicate);
  }

  public enqueue(item: T): void {
    if (this.size === this.slots.length)
      this.grow();
    this.slots[(this.head + this.size) % this.slots.length] = item;
    this.size++;
    this.changes.increment();
  }

  public dequeue(): T {
    const item = this.peek();
    this.slots[this.head] = undefined;
    this.head = (this.head + 1) % this.slots.length;
    this.size--;
    this.changes.increment();

    return item;
  }

  public tryDequeue(): T | undefined {
    return this.size === 0 ? undefined : this.dequeue();
  }

  public peek(): T {
    const item = this.slots[this.head];
    if (Object.isUndefined(item))
      throw new InvalidOperationException(Resources.collectionEmpty);

    return item;
  }

  public tryPeek(): T | undefined {
    return this.slots[this.head];
  }

  public clear(): void {
    this.slots = [];
    this.head = 0;
    this.size = 0;
    this.changes.increment();
  }

  private grow(): void {
    const slots = [...this.slots.slice(this.head), ...this.slots.slice(0, this.head)];
    const capacity = Math.max(slots.length * 2, Queue.MINIMUM_CAPACITY);
    while (slots.length < capacity)
      slots.push(undefined);
    this.slots = slots;
    this.head = 0;
  }
}
