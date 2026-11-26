/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChunkedList } from "@noldova/context.collections";

export class WalkedChunkedList<T extends {} | null> extends ChunkedList<T> {
  private walkCount: number = 0;

  public get walks(): number {
    return this.walkCount;
  }

  public override [Symbol.iterator](): Iterator<T> {
    this.walkCount++;

    return super[Symbol.iterator]();
  }
}
