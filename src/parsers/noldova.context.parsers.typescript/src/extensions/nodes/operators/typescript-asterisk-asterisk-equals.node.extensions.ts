/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAsteriskAsteriskEqualsNode } from "../../../models/nodes/operators/typescript-asterisk-asterisk-equals.node.js";

TypeScriptAsteriskAsteriskEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptAsteriskAsteriskEqualsNode): boolean {
  return true;
};
