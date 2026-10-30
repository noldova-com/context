/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptTemplateExpressionNode } from "../../../models/nodes/expressions/typescript-template-expression.node.js";

TypeScriptTemplateExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptTemplateExpressionNode): boolean {
  return true;
};

TypeScriptTemplateExpressionNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptTemplateExpressionNode): boolean {
  return true;
};
