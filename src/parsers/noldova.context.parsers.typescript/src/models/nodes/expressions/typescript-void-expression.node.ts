/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptVoidKeywordNode } from "../keywords/typescript-void-keyword.node.js";

export class TypeScriptVoidExpressionNode extends Node {
  public readonly expressionNode: Node;
  public readonly voidKeywordNode: TypeScriptVoidKeywordNode;

  public constructor(
    voidKeywordNode: TypeScriptVoidKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.voidKeywordNode = voidKeywordNode;
    this.expressionNode = expressionNode;
  }
}
