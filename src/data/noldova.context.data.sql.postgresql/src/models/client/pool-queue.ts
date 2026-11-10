/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export class PoolQueue<T> {
  private static readonly compactAt: number = 1024;

  private items: (T | undefined)[] = [];
  private head: number = 0;

  public get length(): number {
    return this.items.length - this.head;
  }

  public push(item: T): void {
    this.items.push(item);
  }

  public peek(): T | undefined {
    return this.items[this.head];
  }

  public shift(): T | undefined {
    const item = this.items[this.head];
    this.items[this.head] = undefined;
    this.head += 1;
    if (this.head === this.items.length) {
      this.items = [];
      this.head = 0;
    }
    else if (this.head > PoolQueue.compactAt && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }

    return item;
  }

  public take(): T[] {
    const all: T[] = [];
    for (const item of this.items.slice(this.head))
      if (!Object.isUndefined(item))
        all.push(item);

    this.items = [];
    this.head = 0;
    return all;
  }

  public remove(predicate: (item: T) => boolean): boolean {
    for (let index = this.head; index < this.items.length; index += 1) {
      const item = this.items[index];
      if (!Object.isUndefined(item) && predicate(item)) {
        this.items.splice(index, 1);
        return true;
      }
    }

    return false;
  }
}
