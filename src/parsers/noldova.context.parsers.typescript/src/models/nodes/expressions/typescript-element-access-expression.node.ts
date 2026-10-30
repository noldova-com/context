/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptCloseBracketNode } from "../delimiters/typescript-close-bracket.node.js";
import type { TypeScriptOpenBracketNode } from "../delimiters/typescript-open-bracket.node.js";
import type { TypeScriptQuestionDotNode } from "../operators/typescript-question-dot.node.js";

export class TypeScriptElementAccessExpressionNode extends Node {
  public readonly argumentExpressionNode: Node;
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;
  public readonly expressionNode: Node;
  public readonly openBracketNode: TypeScriptOpenBracketNode;
  public readonly questionDotNode: TypeScriptQuestionDotNode | undefined;

  public constructor(
    expressionNode: Node,
    span: SourceSpan,
    argumentExpressionNode: Node,
    openBracketNode: TypeScriptOpenBracketNode,
    questionDotNode?: TypeScriptQuestionDotNode,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.expressionNode = expressionNode;
    this.questionDotNode = questionDotNode;
    this.openBracketNode = openBracketNode;
    this.argumentExpressionNode = argumentExpressionNode;
    this.closeBracketNode = closeBracketNode;
  }
}
