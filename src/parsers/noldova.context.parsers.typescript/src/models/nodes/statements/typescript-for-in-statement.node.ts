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
import type { TypeScriptForKeywordNode } from "../keywords/typescript-for-keyword.node.js";
import type { TypeScriptInKeywordNode } from "../keywords/typescript-in-keyword.node.js";
import { TypeScriptForInOrOfStatementNode } from "./typescript-for-in-or-of-statement.node.js";

export class TypeScriptForInStatementNode extends TypeScriptForInOrOfStatementNode {
  public readonly inKeywordNode: TypeScriptInKeywordNode;

  public constructor(
    forKeywordNode: TypeScriptForKeywordNode,
    initializerNode: Node,
    inKeywordNode: TypeScriptInKeywordNode,
    expressionNode: Node,
    statementNode: Node,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(forKeywordNode, initializerNode, expressionNode, statementNode, span, openParenthesisNode, closeParenthesisNode, leadingTrivia, trailingTrivia);
    this.inKeywordNode = inKeywordNode;
  }
}
