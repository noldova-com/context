/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptDeleteKeywordNode } from "../keywords/typescript-delete-keyword.node.js";

export class TypeScriptDeleteExpressionNode extends Node {
  public readonly deleteKeywordNode: TypeScriptDeleteKeywordNode;
  public readonly expressionNode: Node;

  public constructor(
    deleteKeywordNode: TypeScriptDeleteKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.deleteKeywordNode = deleteKeywordNode;
    this.expressionNode = expressionNode;
  }
}
