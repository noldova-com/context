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
import type { TypeScriptForKeywordNode } from "../keywords/typescript-for-keyword.node.js";

export abstract class TypeScriptForInOrOfStatementNode extends Node {
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly expressionNode: Node;
  public readonly forKeywordNode: TypeScriptForKeywordNode;
  public readonly initializerNode: Node;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly statementNode: Node;

  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    initializerNode: Node,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.forKeywordNode = forKeywordNode;
    this.openParenthesisNode = openParenthesisNode;
    this.initializerNode = initializerNode;
    this.expressionNode = expressionNode;
    this.closeParenthesisNode = closeParenthesisNode;
    this.statementNode = statementNode;
  }
}
