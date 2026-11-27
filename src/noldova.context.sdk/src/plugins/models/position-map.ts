/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { IReadOnlyList } from "@noldova/context.collections";
import { Source, SourceLineMap, type SourcePosition } from "@noldova/context.parsers";
import { EcmaScriptLineTerminator } from "@noldova/context.text";

import { OriginalPosition } from "./original-position.js";
import type { PositionSegment } from "./position-segment.js";

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

  public originalOf(position: SourcePosition): OriginalPosition {
    const offset = this.lines.getOffset(position);
    const segment = this.rest.prepend(this.first).last(t => t.generatedStart <= offset);

    return new OriginalPosition(segment.source.path, segment.source.lines.getPosition(segment.originalOffsetOf(offset)));
  }
}
