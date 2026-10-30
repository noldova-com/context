/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptExclamationEqualsNode } from "../../../models/nodes/operators/typescript-exclamation-equals.node.js";

TypeScriptExclamationEqualsNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptExclamationEqualsNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Equality;
};

TypeScriptExclamationEqualsNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptExclamationEqualsNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
