/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceText } from "./source-text.js";

export class PositionSegment {
  public readonly generatedStart: number;
  public readonly generatedEnd: number;
  public readonly source: SourceText;
  public readonly originalStart: number;
  public readonly isGenerated: boolean;

  public constructor(generatedStart: number, generatedEnd: number, source: SourceText, originalStart: number, isGenerated: boolean) {
    this.generatedStart = generatedStart;
    this.generatedEnd = generatedEnd;
    this.source = source;
    this.originalStart = originalStart;
    this.isGenerated = isGenerated;
  }

  public originalOffsetOf(generatedOffset: number): number {
    return this.isGenerated ? this.originalStart : this.originalStart + generatedOffset - this.generatedStart;
  }
}
