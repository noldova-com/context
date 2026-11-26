/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ListChunks } from "@noldova/context.collections/models/list-chunks.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ListChunksTests {
  @TestMethod
  public keepsTheChunkCountNearTheLengthOverTheChunkSizeAsInsertsRepeatAtOnePosition(): void {
    const chunks = new ListChunks<number>(8, 0, 0, () => 0);

    for (let insert = 0; insert < 10_000; insert++)
      chunks.replace(Math.min(chunks.length, 5), 0, [insert]);

    ListChunksTests.assertBalanced(chunks, 8);
  }

  @TestMethod
  public mergesAChunkLeftUnderHalfTheChunkSizeWithAChunkBeforeIt(): void {
    const chunks = new ListChunks<number>(8, 0, 32, () => 0);

    chunks.replace(9, 6, []);

    Assert.areEqual("5,5,8,8", ListChunksTests.lengths(chunks));
  }

  @TestMethod
  public mergesAFirstChunkLeftUnderHalfTheChunkSizeWithTheChunkAfterIt(): void {
    const chunks = new ListChunks<number>(8, 0, 16, () => 0);

    chunks.replace(0, 7, []);

    Assert.areEqual("4,5", ListChunksTests.lengths(chunks));
  }

  @TestMethod
  public keepsALoneSmallChunk(): void {
    const chunks = new ListChunks<number>(8, 0, 3, () => 0);

    chunks.replace(1, 1, []);

    Assert.areEqual("2", ListChunksTests.lengths(chunks));
  }

  @TestMethod
  public splitsALargeInsertIntoChunksOfNearlyEqualSize(): void {
    const chunks = new ListChunks<number>(8, 0, 0, () => 0);

    chunks.replace(0, 0, new Array<number>(20).fill(1));

    Assert.areEqual("6,7,7", ListChunksTests.lengths(chunks));
  }

  @TestMethod
  public dropsTheChunksARemovalCoversWhole(): void {
    const chunks = new ListChunks<number>(8, 0, 40, () => 0);

    chunks.replace(4, 32, []);

    Assert.areEqual("8", ListChunksTests.lengths(chunks));
    Assert.areEqual(8, chunks.length);
  }

  private static lengths(chunks: ListChunks<number>): string {
    return Array.from(chunks, t => t.length).join(",");
  }

  private static assertBalanced(chunks: ListChunks<number>, chunkSize: number): void {
    const lengths = Array.from(chunks, t => t.length);

    Assert.isTrue(lengths.length <= 2 * chunks.length / chunkSize + 1, `${lengths.length} chunks for ${chunks.length} elements`);
    Assert.isTrue(lengths.every(t => t <= chunkSize), lengths.join(","));
  }
}
