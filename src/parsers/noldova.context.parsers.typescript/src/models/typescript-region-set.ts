/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

export class TypeScriptRegionSet {
  private readonly regions: SourceSpan[] = [];

  public constructor(spans: readonly SourceSpan[]) {
    for (const span of [...spans].sort((first, second) => first.startOffset - second.startOffset))
      if (this.regions.length === 0 || span.startOffset >= this.regions.at(-1)!.endOffset)
        this.regions.push(span);
  }

  public get isEmpty(): boolean {
    return this.regions.length === 0;
  }

  public contains(offset: number): boolean {
    let low = 0;
    let high = this.regions.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      if (this.regions[middle]!.startOffset <= offset)
        low = middle + 1;
      else
        high = middle - 1;
    }

    return high >= 0 && offset < this.regions[high]!.endOffset;
  }
}
