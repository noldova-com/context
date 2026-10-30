/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptShiftRightEqualsNode } from "../../../models/nodes/operators/typescript-shift-right-equals.node.js";

TypeScriptShiftRightEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptShiftRightEqualsNode): boolean {
  return true;
};
