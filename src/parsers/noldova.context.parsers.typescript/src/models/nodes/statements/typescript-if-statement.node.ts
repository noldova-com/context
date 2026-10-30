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
import type { TypeScriptElseKeywordNode } from "../keywords/typescript-else-keyword.node.js";
import type { TypeScriptIfKeywordNode } from "../keywords/typescript-if-keyword.node.js";

export class TypeScriptIfStatementNode extends Node {
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly conditionNode: Node;
  public readonly elseKeywordNode: TypeScriptElseKeywordNode | undefined;
  public readonly elseStatementNode: Node | undefined;
  public readonly ifKeywordNode: TypeScriptIfKeywordNode;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly statementNode: Node;

  public constructor(
    ifKeywordNode: TypeScriptIfKeywordNode,
    statementNode: Node,
    span: SourceSpan,
    conditionNode: Node,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    elseKeywordNode?: TypeScriptElseKeywordNode,
    elseStatementNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.ifKeywordNode = ifKeywordNode;
    this.openParenthesisNode = openParenthesisNode;
    this.conditionNode = conditionNode;
    this.closeParenthesisNode = closeParenthesisNode;
    this.statementNode = statementNode;
    this.elseKeywordNode = elseKeywordNode;
    this.elseStatementNode = elseStatementNode;
  }
}
