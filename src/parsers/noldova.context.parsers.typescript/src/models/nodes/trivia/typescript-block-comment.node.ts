/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CommentNode, type Node, type SourceSpan } from "@noldova/context.parsers";

export class TypeScriptBlockCommentNode extends CommentNode {
  public constructor(value: string, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(value, span, leadingTrivia, trailingTrivia);
  }
}
