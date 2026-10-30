/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCaretEqualsNode } from "../../../models/nodes/operators/typescript-caret-equals.node.js";

TypeScriptCaretEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptCaretEqualsNode): boolean {
  return true;
};
