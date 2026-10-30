/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptBarBarEqualsNode } from "../../../models/nodes/operators/typescript-bar-bar-equals.node.js";

TypeScriptBarBarEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptBarBarEqualsNode): boolean {
  return true;
};
