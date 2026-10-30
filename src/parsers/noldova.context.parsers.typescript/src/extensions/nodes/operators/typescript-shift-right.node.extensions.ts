/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptShiftRightNode } from "../../../models/nodes/operators/typescript-shift-right.node.js";

TypeScriptShiftRightNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptShiftRightNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Shift;
};

TypeScriptShiftRightNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptShiftRightNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
