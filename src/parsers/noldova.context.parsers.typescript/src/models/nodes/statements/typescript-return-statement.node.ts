/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptReturnKeywordNode } from "../keywords/typescript-return-keyword.node.js";

export class TypeScriptReturnStatementNode extends Node {
  public readonly expressionNode: Node | undefined;
  public readonly returnKeywordNode: TypeScriptReturnKeywordNode;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  public constructor(
    returnKeywordNode: TypeScriptReturnKeywordNode,
    span: SourceSpan,
    expressionNode?: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.returnKeywordNode = returnKeywordNode;
    this.expressionNode = expressionNode;
    this.semicolonNode = semicolonNode;
  }
}
