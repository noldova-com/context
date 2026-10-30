/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptTypeOfKeywordNode } from "../keywords/typescript-type-of-keyword.node.js";

export class TypeScriptTypeOfExpressionNode extends Node {
  public readonly expressionNode: Node;
  public readonly typeOfKeywordNode: TypeScriptTypeOfKeywordNode;

  public constructor(
    typeOfKeywordNode: TypeScriptTypeOfKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.typeOfKeywordNode = typeOfKeywordNode;
    this.expressionNode = expressionNode;
  }
}
