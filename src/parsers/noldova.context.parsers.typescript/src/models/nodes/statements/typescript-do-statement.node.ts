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
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptDoKeywordNode } from "../keywords/typescript-do-keyword.node.js";
import type { TypeScriptWhileKeywordNode } from "../keywords/typescript-while-keyword.node.js";

export class TypeScriptDoStatementNode extends Node {
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly conditionNode: Node;
  public readonly doKeywordNode: TypeScriptDoKeywordNode;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly statementNode: Node;
  public readonly whileKeywordNode: TypeScriptWhileKeywordNode | undefined;

  public constructor(
    doKeywordNode: TypeScriptDoKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    conditionNode: Node,
    whileKeywordNode?: TypeScriptWhileKeywordNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.doKeywordNode = doKeywordNode;
    this.statementNode = statementNode;
    this.whileKeywordNode = whileKeywordNode;
    this.openParenthesisNode = openParenthesisNode;
    this.conditionNode = conditionNode;
    this.closeParenthesisNode = closeParenthesisNode;
    this.semicolonNode = semicolonNode;
  }
}
