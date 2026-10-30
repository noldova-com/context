/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptGreaterThanEqualsNode } from "../../../models/nodes/operators/typescript-greater-than-equals.node.js";

TypeScriptGreaterThanEqualsNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptGreaterThanEqualsNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Relational;
};

TypeScriptGreaterThanEqualsNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptGreaterThanEqualsNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
