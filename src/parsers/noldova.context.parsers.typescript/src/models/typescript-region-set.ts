/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BinarySearchService } from "@noldova/context.collections";
import type { SourceSpan } from "@noldova/context.parsers";

export class TypeScriptRegionSet {
  private readonly regions: SourceSpan[] = [];
  private readonly startOffsets: number[] = [];

  public constructor(spans: readonly SourceSpan[]) {
    let endOffset = Number.NEGATIVE_INFINITY;
    for (const span of [...spans].sort((first, second) => first.startOffset - second.startOffset))
      if (span.startOffset >= endOffset) {
        this.regions.push(span);
        this.startOffsets.push(span.startOffset);
        endOffset = span.endOffset;
      }
  }

  public get isEmpty(): boolean {
    return this.regions.length === 0;
  }

  public contains(offset: number): boolean {
    const region = this.regions[BinarySearchService.floorIndex(this.startOffsets, offset)];
    return !Object.isUndefined(region) && offset < region.endOffset;
  }
}
