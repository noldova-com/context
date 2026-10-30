/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptAsteriskAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk-asterisk.node.js";

TypeScriptAsteriskAsteriskNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptAsteriskAsteriskNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Exponentiation;
};

TypeScriptAsteriskAsteriskNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptAsteriskAsteriskNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Right;
};
