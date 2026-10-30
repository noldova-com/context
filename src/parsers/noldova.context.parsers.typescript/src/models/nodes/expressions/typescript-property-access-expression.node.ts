/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptDotNode } from "../delimiters/typescript-dot.node.js";
import type { TypeScriptQuestionDotNode } from "../operators/typescript-question-dot.node.js";

export class TypeScriptPropertyAccessExpressionNode extends Node {
  public readonly accessNode: TypeScriptDotNode | TypeScriptQuestionDotNode | undefined;
  public readonly expressionNode: Node;
  public readonly nameNode: Node;

  public constructor(
    expressionNode: Node,
    accessNode: TypeScriptDotNode | TypeScriptQuestionDotNode | undefined,
    span: SourceSpan,
    nameNode: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.expressionNode = expressionNode;
    this.accessNode = accessNode;
    this.nameNode = nameNode;
  }
}
