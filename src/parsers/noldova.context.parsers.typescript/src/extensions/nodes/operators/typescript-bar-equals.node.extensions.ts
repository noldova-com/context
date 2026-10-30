/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptBarEqualsNode } from "../../../models/nodes/operators/typescript-bar-equals.node.js";

TypeScriptBarEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptBarEqualsNode): boolean {
  return true;
};
