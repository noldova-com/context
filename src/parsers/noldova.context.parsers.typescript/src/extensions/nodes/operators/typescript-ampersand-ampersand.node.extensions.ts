/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptAmpersandAmpersandNode } from "../../../models/nodes/operators/typescript-ampersand-ampersand.node.js";

TypeScriptAmpersandAmpersandNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptAmpersandAmpersandNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.LogicalAnd;
};

TypeScriptAmpersandAmpersandNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptAmpersandAmpersandNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptAmpersandAmpersandNode.prototype.isTypeScriptLogicalOperator = function (this: TypeScriptAmpersandAmpersandNode): this is TypeScriptAmpersandAmpersandNode {
  return true;
};

TypeScriptAmpersandAmpersandNode.prototype.passesTypeScriptContextualTypeToRightOperand = function (this: TypeScriptAmpersandAmpersandNode): boolean {
  return true;
};
