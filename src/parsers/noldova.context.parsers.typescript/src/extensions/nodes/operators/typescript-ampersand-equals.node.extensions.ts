/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAmpersandEqualsNode } from "../../../models/nodes/operators/typescript-ampersand-equals.node.js";

TypeScriptAmpersandEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptAmpersandEqualsNode): boolean {
  return true;
};
