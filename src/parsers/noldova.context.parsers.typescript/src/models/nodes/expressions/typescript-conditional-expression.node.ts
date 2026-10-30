/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptConditionalExpressionNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly conditionNode: Node;
  public readonly falseExpressionNode: Node;
  public readonly questionNode: TypeScriptQuestionNode;
  public readonly trueExpressionNode: Node;

  public constructor(
    conditionNode: Node,
    questionNode: TypeScriptQuestionNode,
    span: SourceSpan,
    trueExpressionNode: Node,
    falseExpressionNode: Node,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.conditionNode = conditionNode;
    this.questionNode = questionNode;
    this.trueExpressionNode = trueExpressionNode;
    this.colonNode = colonNode;
    this.falseExpressionNode = falseExpressionNode;
  }
}
