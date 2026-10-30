/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptParenthesizedExpressionNode } from "../../../models/nodes/expressions/typescript-parenthesized-expression.node.js";

TypeScriptParenthesizedExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptParenthesizedExpressionNode): boolean {
  return true;
};

TypeScriptParenthesizedExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptParenthesizedExpressionNode): SourceSpan {
  return this.openParenthesisNode.span;
};

TypeScriptParenthesizedExpressionNode.prototype.getTypeScriptOuterExpressionOperand = function (this: TypeScriptParenthesizedExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptParenthesizedExpressionNode.prototype.getTypeScriptUnparenthesizedExpression = function (this: TypeScriptParenthesizedExpressionNode): Node {
  return this.expressionNode.getTypeScriptUnparenthesizedExpression();
};

TypeScriptParenthesizedExpressionNode.prototype.getTypeScriptQuickTypeSkippedSpan = function (this: TypeScriptParenthesizedExpressionNode): SourceSpan | undefined {
  return this.expressionNode.getTypeScriptQuickTypeSkippedSpan();
};

TypeScriptParenthesizedExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptParenthesizedExpressionNode): boolean {
  return this.expressionNode.readsTypeScriptContextualType();
};
