/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptUnsignedShiftRightNode } from "../../../models/nodes/operators/typescript-unsigned-shift-right.node.js";

TypeScriptUnsignedShiftRightNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptUnsignedShiftRightNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Shift;
};

TypeScriptUnsignedShiftRightNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptUnsignedShiftRightNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};
