/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptNewKeywordNode } from "../keywords/typescript-new-keyword.node.js";
import type { TypeScriptTypeArgumentListNode } from "../types/typescript-type-argument-list.node.js";
import type { TypeScriptArgumentListNode } from "./typescript-argument-list.node.js";

export class TypeScriptNewExpressionNode extends Node {
  public readonly argumentListNode: TypeScriptArgumentListNode | undefined;
  public readonly expressionNode: Node;
  public readonly newKeywordNode: TypeScriptNewKeywordNode;
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  public constructor(
    newKeywordNode: TypeScriptNewKeywordNode,
    span: SourceSpan,
    expressionNode: Node,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    argumentListNode?: TypeScriptArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.newKeywordNode = newKeywordNode;
    this.expressionNode = expressionNode;
    this.typeArgumentListNode = typeArgumentListNode;
    this.argumentListNode = argumentListNode;
  }
}
