/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type IReadOnlyList, List } from "@noldova/context.collections";
import { StringBuilder } from "@noldova/context.text";

import { PositionMap } from "../models/position-map.js";
import { PositionSegment } from "../models/position-segment.js";
import type { SourceEdit } from "../models/source-edit.js";
import type { SourceFile } from "../models/source-file.js";

export class SourceRewriter {
  private readonly source: SourceFile;
  private readonly text: StringBuilder = new StringBuilder();
  private readonly segments: List<PositionSegment> = new List<PositionSegment>();

  private constructor(source: SourceFile) {
    this.source = source;
  }

  public static rewrite(path: string, source: SourceFile, edits: IReadOnlyList<SourceEdit>): PositionMap {
    const rewriter = new SourceRewriter(source);
    let original = 0;
    for (const edit of edits) {
      rewriter.append(source.source.content.substring(original, edit.span.startOffset), original, false);
      rewriter.append(edit.text, edit.span.startOffset, true);
      original = edit.span.endOffset;
    }
    rewriter.append(source.source.content.substring(original), original, false);

    return new PositionMap(path, rewriter.text.toString(), new PositionSegment(0, 0, source, 0, false), rewriter.segments);
  }

  private append(text: string, originalStart: number, isGenerated: boolean): void {
    this.segments.add(new PositionSegment(this.text.length, this.text.length + text.length, this.source, originalStart, isGenerated));
    this.text.append(text);
  }
}
