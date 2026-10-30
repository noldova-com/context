/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptEqualsEqualsEqualsNode } from "../../../models/nodes/operators/typescript-equals-equals-equals.node.js";

TypeScriptEqualsEqualsEqualsNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptEqualsEqualsEqualsNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Equality;
};

TypeScriptEqualsEqualsEqualsNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptEqualsEqualsEqualsNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
