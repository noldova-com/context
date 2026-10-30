/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptShiftLeftEqualsNode } from "../../../models/nodes/operators/typescript-shift-left-equals.node.js";

TypeScriptShiftLeftEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptShiftLeftEqualsNode): boolean {
  return true;
};
