/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptAwaitKeywordNode } from "../keywords/typescript-await-keyword.node.js";

export class TypeScriptAwaitExpressionNode extends Node {
  public readonly awaitKeywordNode: TypeScriptAwaitKeywordNode;
  public readonly expressionNode: Node;

  public constructor(
    awaitKeywordNode: TypeScriptAwaitKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.awaitKeywordNode = awaitKeywordNode;
    this.expressionNode = expressionNode;
  }
}
