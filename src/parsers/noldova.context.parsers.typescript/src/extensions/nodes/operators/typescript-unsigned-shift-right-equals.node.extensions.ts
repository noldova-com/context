/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptUnsignedShiftRightEqualsNode } from "../../../models/nodes/operators/typescript-unsigned-shift-right-equals.node.js";

TypeScriptUnsignedShiftRightEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptUnsignedShiftRightEqualsNode): boolean {
  return true;
};
