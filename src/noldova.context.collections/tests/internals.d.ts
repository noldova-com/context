/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context.collections/models/list-chunks.js" {
  export class ListChunks<T extends {} | null> implements Iterable<{ readonly length: number }> {
    public constructor(chunkSize: number, fill: T, length: number, weigh: (item: T) => number);
    public get length(): number;
    public [Symbol.iterator](): Iterator<{ readonly length: number }>;
    public replace(index: number, removed: number, items: readonly T[]): void;
  }
}
