/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptCloseParenthesisNode } from "../delimiters/typescript-close-parenthesis.node.js";
import type { TypeScriptOpenParenthesisNode } from "../delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptWhileKeywordNode } from "../keywords/typescript-while-keyword.node.js";

export class TypeScriptWhileStatementNode extends Node {
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly conditionNode: Node;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly statementNode: Node;
  public readonly whileKeywordNode: TypeScriptWhileKeywordNode;

  public constructor(
    whileKeywordNode: TypeScriptWhileKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    conditionNode: Node,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.whileKeywordNode = whileKeywordNode;
    this.openParenthesisNode = openParenthesisNode;
    this.conditionNode = conditionNode;
    this.closeParenthesisNode = closeParenthesisNode;
    this.statementNode = statementNode;
  }
}
