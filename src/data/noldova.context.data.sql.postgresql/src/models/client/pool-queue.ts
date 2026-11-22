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

  public get(index: number): T | undefined {
    return index < 0 ? undefined : this.items[this.head + index];
  }

  public unshift(item: T): void {
    if (this.head === 0) {
      this.items.unshift(item);
      return;
    }

    this.head -= 1;
    this.items[this.head] = item;
  }

  public indexOf(item: T): number {
    const index = this.items.indexOf(item, this.head);
    return index < 0 ? -1 : index - this.head;
  }

  public findIndex(predicate: (item: T) => boolean): number {
    for (let index = this.head; index < this.items.length; index += 1) {
      const item = this.items[index];
      if (!Object.isUndefined(item) && predicate(item))
        return index - this.head;
    }

    return -1;
  }

  public find(predicate: (item: T) => boolean): T | undefined {
    return this.get(this.findIndex(predicate));
  }

  public insertAt(index: number, item: T): void {
    this.items.splice(this.head + index, 0, item);
  }

  public removeAt(index: number): void {
    this.items.splice(this.head + index, 1);
  }

  public toArray(): T[] {
    const all: T[] = [];
    for (let index = this.head; index < this.items.length; index += 1) {
      const item = this.items[index];
      if (!Object.isUndefined(item))
        all.push(item);
    }

    return all;
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
    const all = this.toArray();
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
