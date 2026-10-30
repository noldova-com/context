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

export class TypeScriptParenthesizedExpressionNode extends Node {
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;
  public readonly expressionNode: Node;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode;

  public constructor(
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    expressionNode: Node,
    closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.openParenthesisNode = openParenthesisNode;
    this.expressionNode = expressionNode;
    this.closeParenthesisNode = closeParenthesisNode;
  }
}
