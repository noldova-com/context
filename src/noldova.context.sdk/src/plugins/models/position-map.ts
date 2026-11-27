/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";
import { Source, SourceLineMap, type SourcePosition } from "@noldova/context.parsers";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

import { OriginalPosition } from "./original-position.js";
import { PositionSegment } from "./position-segment.js";
import type { SourceText } from "./source-text.js";

export class PositionMap {
  public readonly path: string;
  public readonly text: string;
  private readonly lines: SourceLineMap;
  private readonly first: PositionSegment;
  private readonly rest: IReadOnlyList<PositionSegment>;

  public constructor(path: string, text: string, first: PositionSegment, rest: IReadOnlyList<PositionSegment>) {
    this.path = path;
    this.text = text;
    this.lines = new SourceLineMap(new Source(text), new EcmaScriptLineTerminator());
    this.first = first;
    this.rest = rest;
  }

  public static identityOf(path: string, original: SourceText): PositionMap {
    return new PositionMap(path, original.source.content, new PositionSegment(0, 0, original, 0, false), new List<PositionSegment>());
  }

  public originalOf(position: SourcePosition): OriginalPosition {
    const offset = this.lines.getOffset(position);
    const segment = this.rest.prepend(this.first).last(t => t.generatedStart <= offset);

    return new OriginalPosition(segment.source, segment.source.lines.getPosition(segment.originalOffsetOf(offset)));
  }
}
