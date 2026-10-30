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

export class TypeScriptExpressionStatementNode extends Node {
  public readonly expressionNode: Node;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  public constructor(
    expressionNode: Node,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.expressionNode = expressionNode;
    this.semicolonNode = semicolonNode;
  }
}
