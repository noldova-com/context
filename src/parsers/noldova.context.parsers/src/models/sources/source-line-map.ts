/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { BinarySearchService } from "@noldova/context.collections";
import { nameof } from "@noldova/context.core";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { type LineTerminator, ReadOnlyStringSpan } from "@noldova/context.text";

import { InvalidOffsetException } from "../../exceptions/invalid-offset.exception.js";
import { LineOutOfBoundsException } from "../../exceptions/line-out-of-bounds.exception.js";
import { SourceLine } from "./source-line.js";
import { SourcePosition } from "./source-position.js";
import type { Source } from "./source.js";
import { Resources } from "../../resources.js";

export class SourceLineMap {
  private readonly lineStarts: readonly number[];
  private readonly source: Source;

  public readonly lines: readonly SourceLine[];

  public constructor(source: Source, lineTerminator: LineTerminator) {
    const lineStarts: number[] = [0];
    const lines: SourceLine[] = [];
    let lineStartOffset = 0;
    for (let index = 0; index < source.length; index++) {
      const lineBreakLength = lineTerminator.getLength(source.content, index);
      if (lineBreakLength === 0)
        continue;

      lines.push(new SourceLine(lines.length, lineStartOffset, index, lineBreakLength));
      index += lineBreakLength - 1;
      lineStartOffset = index + 1;
      lineStarts.push(lineStartOffset);
    }

    lines.push(new SourceLine(lines.length, lineStartOffset, source.length, 0));
    this.source = source;
    this.lineStarts = lineStarts;
    this.lines = lines;
  }

  public get lineCount(): number {
    return this.lines.length;
  }

  public getLineSpan(lineIndex: number): ReadOnlyStringSpan {
    const line = this.getLine(lineIndex);
    return this.source.getSpan(line.startOffset, line.length);
  }

  public getLineText(lineIndex: number): string {
    return this.getLineSpan(lineIndex).toString();
  }

  public getPosition(offset: number): SourcePosition {
    InvalidOffsetException.throwIfOutsideRange(offset, 0, this.source.length);

    const lineIndex = BinarySearchService.floorIndex(this.lineStarts, offset);
    const line = this.getLine(lineIndex);
    return new SourcePosition(lineIndex, offset - line.startOffset);
  }

  public getOffset(position: SourcePosition): number {
    const line = this.getLine(position.lineIndex);
    const maximumCharacterIndex = line.length + Math.max(0, line.lineBreakLength - 1);
    if (position.characterIndex > maximumCharacterIndex)
      throw new ArgumentOutOfRangeException(nameof<SourcePosition>(t => t.characterIndex), position.characterIndex, Resources.characterIndexInvalid);

    return line.startOffset + position.characterIndex;
  }

  private getLine(lineIndex: number): SourceLine {
    LineOutOfBoundsException.throwIfOutOfBounds(lineIndex, this.lines.length);
    return this.lines[lineIndex]!;
  }
}
