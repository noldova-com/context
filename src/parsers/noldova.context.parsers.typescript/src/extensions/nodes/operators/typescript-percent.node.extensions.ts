/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptPercentNode } from "../../../models/nodes/operators/typescript-percent.node.js";

TypeScriptPercentNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptPercentNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Multiplicative;
};

TypeScriptPercentNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptPercentNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
