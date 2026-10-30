/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseParenthesisNode } from "../delimiters/typescript-close-parenthesis.node.js";
import type { TypeScriptOpenParenthesisNode } from "../delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptWithKeywordNode } from "../keywords/typescript-with-keyword.node.js";

export class TypeScriptWithStatementNode extends Node {
  public readonly withKeywordNode: TypeScriptWithKeywordNode;
  public readonly expressionNode: Node;
  public readonly statementNode: Node;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  public constructor(
    withKeywordNode: TypeScriptWithKeywordNode,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.withKeywordNode = withKeywordNode;
    this.expressionNode = expressionNode;
    this.statementNode = statementNode;
    this.openParenthesisNode = openParenthesisNode;
    this.closeParenthesisNode = closeParenthesisNode;
  }
}
