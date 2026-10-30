/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptPlusEqualsNode } from "../../../models/nodes/operators/typescript-plus-equals.node.js";

TypeScriptPlusEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptPlusEqualsNode): boolean {
  return true;
};
