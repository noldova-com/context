/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptCallExpressionNode } from "../../../models/nodes/expressions/typescript-call-expression.node.js";

TypeScriptCallExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptCallExpressionNode): boolean {
  return true;
};

TypeScriptCallExpressionNode.prototype.getTypeScriptDecoratorChainOperand = function (this: TypeScriptCallExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptCallExpressionNode.prototype.getTypeScriptDecoratorLinkError = function (this: TypeScriptCallExpressionNode,
  isCallAllowed: boolean): Node | undefined {
  return this.questionDotNode ?? (isCallAllowed ? undefined : this);
};

TypeScriptCallExpressionNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptCallExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptCallExpressionNode.prototype.getTypeScriptChainOperand = function (this: TypeScriptCallExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptCallExpressionNode.prototype.hasTypeScriptQuestionDot = function (this: TypeScriptCallExpressionNode): boolean {
  return !Object.isUndefined(this.questionDotNode);
};

TypeScriptCallExpressionNode.prototype.getTypeScriptQuickTypeSkippedSpan = function (this: TypeScriptCallExpressionNode): SourceSpan | undefined {
  if (!this.expressionNode.isTypeScriptQuickTypedCallee())
    return undefined;

  const startNode = this.questionDotNode ?? this.typeArgumentListNode ?? this.argumentListNode;
  return new SourceSpan(startNode.span.startOffset, this.span.endOffset - startNode.span.startOffset);
};
