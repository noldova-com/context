/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { CompositeNode } from "@noldova/context.parsers";

export class TypeScriptTemplateLiteralTypeNode extends CompositeNode {
  public readonly headNode: Node;

  public constructor(
    headNode: Node,
    spanNodes: readonly Node[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(spanNodes, span, leadingTrivia, trailingTrivia);
    this.headNode = headNode;
  }
}
