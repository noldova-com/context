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
import type { TypeScriptSwitchKeywordNode } from "../keywords/typescript-switch-keyword.node.js";
import type { TypeScriptCaseBlockNode } from "./typescript-case-block.node.js";

export class TypeScriptSwitchStatementNode extends Node {
  public readonly switchKeywordNode: TypeScriptSwitchKeywordNode;
  public readonly expressionNode: Node;
  public readonly caseBlockNode: TypeScriptCaseBlockNode;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  public constructor(
    switchKeywordNode: TypeScriptSwitchKeywordNode,
    expressionNode: Node,
    caseBlockNode: TypeScriptCaseBlockNode,
    span: SourceSpan,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.switchKeywordNode = switchKeywordNode;
    this.expressionNode = expressionNode;
    this.caseBlockNode = caseBlockNode;
    this.openParenthesisNode = openParenthesisNode;
    this.closeParenthesisNode = closeParenthesisNode;
  }
}
