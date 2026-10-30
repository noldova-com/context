/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptEqualsEqualsNode } from "../../../models/nodes/operators/typescript-equals-equals.node.js";

TypeScriptEqualsEqualsNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptEqualsEqualsNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Equality;
};

TypeScriptEqualsEqualsNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptEqualsEqualsNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
