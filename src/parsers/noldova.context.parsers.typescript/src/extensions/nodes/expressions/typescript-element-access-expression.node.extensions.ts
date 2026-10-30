/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptElementAccessExpressionNode } from "../../../models/nodes/expressions/typescript-element-access-expression.node.js";

TypeScriptElementAccessExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptElementAccessExpressionNode): boolean {
  return true;
};

TypeScriptElementAccessExpressionNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptElementAccessExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptElementAccessExpressionNode.prototype.isTypeScriptReference = function (this: TypeScriptElementAccessExpressionNode): boolean {
  return true;
};

TypeScriptElementAccessExpressionNode.prototype.getTypeScriptChainOperand = function (this: TypeScriptElementAccessExpressionNode): Node {
  return this.expressionNode;
};

TypeScriptElementAccessExpressionNode.prototype.hasTypeScriptQuestionDot = function (this: TypeScriptElementAccessExpressionNode): boolean {
  return !Object.isUndefined(this.questionDotNode);
};

TypeScriptElementAccessExpressionNode.prototype.isTypeScriptAccessExpression = function (this: TypeScriptElementAccessExpressionNode): boolean {
  return true;
};
