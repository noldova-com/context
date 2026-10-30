/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { CompositeNode } from "@noldova/context.parsers";

import type { TypeScriptTemplateHeadNode } from "../literals/typescript-template-head.node.js";
import type { TypeScriptTemplateSpanNode } from "./typescript-template-span.node.js";

export class TypeScriptTemplateExpressionNode extends CompositeNode {
  public readonly headNode: TypeScriptTemplateHeadNode;

  public constructor(
    headNode: TypeScriptTemplateHeadNode,
    spanNodes: readonly TypeScriptTemplateSpanNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(spanNodes, span, leadingTrivia, trailingTrivia);
    this.headNode = headNode;
  }
}
