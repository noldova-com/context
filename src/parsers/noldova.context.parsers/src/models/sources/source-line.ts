/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";

import { Resources } from "../../resources.js";

export class SourceLine {
  public readonly lineIndex: number;
  public readonly startOffset: number;
  public readonly endOffset: number;
  public readonly lineBreakLength: 0 | 1 | 2;
  public readonly length: number;

  public constructor(lineIndex: number, startOffset: number, endOffset: number, lineBreakLength: 0 | 1 | 2) {
    if (!Number.isSafeInteger(lineIndex) || lineIndex < 0)
      throw new ArgumentOutOfRangeException(nameof<SourceLine>(t => t.lineIndex), lineIndex, Resources.lineIndexInvalid);

    if (!Number.isSafeInteger(startOffset) || startOffset < 0)
      throw new ArgumentOutOfRangeException(nameof<SourceLine>(t => t.startOffset), startOffset, Resources.lineStartInvalid);

    if (!Number.isSafeInteger(endOffset) || endOffset < startOffset)
      throw new ArgumentOutOfRangeException(nameof<SourceLine>(t => t.endOffset), endOffset, Resources.lineEndInvalid);

    this.lineIndex = lineIndex;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.lineBreakLength = lineBreakLength;
    this.length = endOffset - startOffset;
  }
}
