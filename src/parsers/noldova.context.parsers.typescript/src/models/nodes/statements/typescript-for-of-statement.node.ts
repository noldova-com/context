/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseParenthesisNode } from "../delimiters/typescript-close-parenthesis.node.js";
import type { TypeScriptOpenParenthesisNode } from "../delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptAwaitKeywordNode } from "../keywords/typescript-await-keyword.node.js";
import type { TypeScriptForKeywordNode } from "../keywords/typescript-for-keyword.node.js";
import type { TypeScriptOfKeywordNode } from "../keywords/typescript-of-keyword.node.js";
import { TypeScriptForInOrOfStatementNode } from "./typescript-for-in-or-of-statement.node.js";

export class TypeScriptForOfStatementNode extends TypeScriptForInOrOfStatementNode {
  public readonly awaitKeywordNode: TypeScriptAwaitKeywordNode | undefined;
  public readonly ofKeywordNode: TypeScriptOfKeywordNode;

  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    initializerNode: Node,
    ofKeywordNode: TypeScriptOfKeywordNode,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    awaitKeywordNode?: TypeScriptAwaitKeywordNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(forKeywordNode, initializerNode, expressionNode, statementNode, span, openParenthesisNode, closeParenthesisNode, leadingTrivia, trailingTrivia);
    this.awaitKeywordNode = awaitKeywordNode;
    this.ofKeywordNode = ofKeywordNode;
  }
}
