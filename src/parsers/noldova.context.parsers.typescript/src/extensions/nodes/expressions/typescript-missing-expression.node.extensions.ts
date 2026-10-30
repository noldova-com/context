/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptMissingExpressionNode } from "../../../models/nodes/expressions/typescript-missing-expression.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptMissingExpressionNode.prototype.reportTypeScriptMissingSemicolon = function (
  this: TypeScriptMissingExpressionNode,
  _parser: TypeScriptSyntaxParser): void {
};

TypeScriptMissingExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptMissingExpressionNode): boolean {
  return true;
};
