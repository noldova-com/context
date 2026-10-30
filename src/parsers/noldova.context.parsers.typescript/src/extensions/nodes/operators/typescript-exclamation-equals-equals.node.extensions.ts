/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptExclamationEqualsEqualsNode } from "../../../models/nodes/operators/typescript-exclamation-equals-equals.node.js";

TypeScriptExclamationEqualsEqualsNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptExclamationEqualsEqualsNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Equality;
};

TypeScriptExclamationEqualsEqualsNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptExclamationEqualsEqualsNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
