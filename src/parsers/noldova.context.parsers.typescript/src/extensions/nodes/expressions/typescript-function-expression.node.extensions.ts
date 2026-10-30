/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptFunctionExpressionNode } from "../../../models/nodes/expressions/typescript-function-expression.node.js";

TypeScriptFunctionExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptFunctionExpressionNode): boolean {
  return true;
};

TypeScriptFunctionExpressionNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptFunctionExpressionNode): boolean {
  return true;
};

TypeScriptFunctionExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptFunctionExpressionNode): boolean {
  return true;
};
