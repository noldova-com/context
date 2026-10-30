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
import type { TypeScriptTypeArgumentListNode } from "./typescript-type-argument-list.node.js";

export class TypeScriptTypeQueryNode extends Node {
  public readonly expressionNameNode: Node;
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;
  public readonly typeOfKeywordNode: TypeScriptTypeOfKeywordNode;

  public constructor(
    typeOfKeywordNode: TypeScriptTypeOfKeywordNode,
    span: SourceSpan,
    expressionNameNode: Node,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.typeOfKeywordNode = typeOfKeywordNode;
    this.expressionNameNode = expressionNameNode;
    this.typeArgumentListNode = typeArgumentListNode;
  }
}
