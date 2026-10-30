/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptLessThanEqualsNode } from "../../../models/nodes/operators/typescript-less-than-equals.node.js";

TypeScriptLessThanEqualsNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptLessThanEqualsNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Relational;
};

TypeScriptLessThanEqualsNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptLessThanEqualsNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
