/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNonNullExpressionNode } from "../../../models/nodes/expressions/typescript-non-null-expression.node.js";

TypeScriptNonNullExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptNonNullExpressionNode): boolean {
  return true;
};

TypeScriptNonNullExpressionNode.prototype.getTypeScriptDecoratorChainOperand = function (this: TypeScriptNonNullExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptNonNullExpressionNode.prototype.getTypeScriptDecoratorLinkError = function (this: TypeScriptNonNullExpressionNode,
  _isCallAllowed: boolean): Node | undefined {
  return undefined;
};

TypeScriptNonNullExpressionNode.prototype.keepsTypeScriptDecoratorCallAllowed = function (this: TypeScriptNonNullExpressionNode): boolean {
  return true;
};

TypeScriptNonNullExpressionNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptNonNullExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptNonNullExpressionNode.prototype.getTypeScriptChainOperand = function (this: TypeScriptNonNullExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptNonNullExpressionNode.prototype.getTypeScriptOuterExpressionOperand = function (this: TypeScriptNonNullExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptNonNullExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptNonNullExpressionNode): boolean {
  let expressionNode = this.expressionNode;
  while (expressionNode instanceof TypeScriptNonNullExpressionNode)
    expressionNode = expressionNode.expressionNode;
  return expressionNode.readsTypeScriptContextualType();
};
