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
import type { TypeScriptForKeywordNode } from "../keywords/typescript-for-keyword.node.js";

export class TypeScriptForStatementNode extends Node {
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly conditionNode: Node | undefined;
  public readonly firstSemicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly forKeywordNode: TypeScriptForKeywordNode;
  public readonly incrementorNode: Node | undefined;
  public readonly initializerNode: Node | undefined;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly secondSemicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly statementNode: Node;

  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    initializerNode?: Node,
    firstSemicolonNode?: TypeScriptSemicolonNode,
    conditionNode?: Node,
    secondSemicolonNode?: TypeScriptSemicolonNode,
    incrementorNode?: Node,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.forKeywordNode = forKeywordNode;
    this.openParenthesisNode = openParenthesisNode;
    this.initializerNode = initializerNode;
    this.firstSemicolonNode = firstSemicolonNode;
    this.conditionNode = conditionNode;
    this.secondSemicolonNode = secondSemicolonNode;
    this.incrementorNode = incrementorNode;
    this.closeParenthesisNode = closeParenthesisNode;
    this.statementNode = statementNode;
  }
}
