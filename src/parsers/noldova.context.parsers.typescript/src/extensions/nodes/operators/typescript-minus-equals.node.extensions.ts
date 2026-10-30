/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptMinusEqualsNode } from "../../../models/nodes/operators/typescript-minus-equals.node.js";

TypeScriptMinusEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptMinusEqualsNode): boolean {
  return true;
};
