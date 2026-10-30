/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptQuestionDotNode } from "../operators/typescript-question-dot.node.js";
import type { TypeScriptTypeArgumentListNode } from "../types/typescript-type-argument-list.node.js";
import type { TypeScriptArgumentListNode } from "./typescript-argument-list.node.js";

export class TypeScriptCallExpressionNode extends Node {
  public readonly argumentListNode: TypeScriptArgumentListNode;
  public readonly expressionNode: Node;
  public readonly questionDotNode: TypeScriptQuestionDotNode | undefined;
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  public constructor(
    expressionNode: Node,
    span: SourceSpan,
    argumentListNode: TypeScriptArgumentListNode,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.expressionNode = expressionNode;
    this.questionDotNode = questionDotNode;
    this.typeArgumentListNode = typeArgumentListNode;
    this.argumentListNode = argumentListNode;
  }
}
