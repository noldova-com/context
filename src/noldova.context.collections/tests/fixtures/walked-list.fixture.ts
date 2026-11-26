/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { List } from "@noldova/context.collections";

export class WalkedList<T extends {} | null> extends List<T> {
  private walkCount: number = 0;

  public get walks(): number {
    return this.walkCount;
  }

  public override [Symbol.iterator](): Iterator<T> {
    this.walkCount++;

    return super[Symbol.iterator]();
  }
}
