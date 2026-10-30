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
import type { TypeScriptThrowKeywordNode } from "../keywords/typescript-throw-keyword.node.js";

export class TypeScriptThrowStatementNode extends Node {
  public readonly expressionNode: Node;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly throwKeywordNode: TypeScriptThrowKeywordNode;

  public constructor(
    throwKeywordNode: TypeScriptThrowKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.throwKeywordNode = throwKeywordNode;
    this.expressionNode = expressionNode;
    this.semicolonNode = semicolonNode;
  }
}
