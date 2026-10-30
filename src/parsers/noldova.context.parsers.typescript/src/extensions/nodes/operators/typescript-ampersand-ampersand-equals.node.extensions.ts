/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAmpersandAmpersandEqualsNode } from "../../../models/nodes/operators/typescript-ampersand-ampersand-equals.node.js";

TypeScriptAmpersandAmpersandEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptAmpersandAmpersandEqualsNode): boolean {
  return true;
};
