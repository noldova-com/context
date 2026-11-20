/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { type Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptReparsedRegion } from "../models/typescript-reparsed-region.js";

export class TypeScriptRegionSplicer {
  public static spliceStatements(statements: readonly Node[], regions: readonly TypeScriptReparsedRegion[]): Node[] {
    const result: Node[] = [];
    let emittedIndex = 0;
    let overlapIndex = 0;
    for (const statement of statements) {
      emittedIndex = TypeScriptRegionSplicer.appendRegionsBefore(result, regions, emittedIndex, statement.span.startOffset);
      let region = regions[overlapIndex];
      while (!Object.isUndefined(region) && region.span.endOffset <= statement.span.startOffset) {
        overlapIndex += 1;
        region = regions[overlapIndex];
      }
      if (Object.isUndefined(region) || statement.span.endOffset <= region.span.startOffset)
        result.push(statement);
    }
    TypeScriptRegionSplicer.appendRegionsBefore(result, regions, emittedIndex, Number.POSITIVE_INFINITY);
    return result;
  }

  public static measureReplacedSpans(statements: readonly Node[], regions: readonly TypeScriptReparsedRegion[], endOffset: number): SourceSpan[] {
    const spans: SourceSpan[] = [];
    let followingIndex = 0;
    for (const region of regions) {
      let following = statements[followingIndex];
      while (!Object.isUndefined(following) && following.span.startOffset < region.span.endOffset) {
        followingIndex += 1;
        following = statements[followingIndex];
      }
      const followingOffset = following?.leadingTrivia?.span.startOffset ?? following?.span.startOffset ?? endOffset;
      spans.push(new SourceSpan(region.span.startOffset, followingOffset - region.span.startOffset));
    }
    return spans;
  }

  private static appendRegionsBefore(result: Node[], regions: readonly TypeScriptReparsedRegion[], startIndex: number, offset: number): number {
    let index = startIndex;
    let region = regions[index];
    while (!Object.isUndefined(region) && region.span.startOffset < offset) {
      for (const statement of region.statements)
        result.push(statement);
      index += 1;
      region = regions[index];
    }
    return index;
  }
}
