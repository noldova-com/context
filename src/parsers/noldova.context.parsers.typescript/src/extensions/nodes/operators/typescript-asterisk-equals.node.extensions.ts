/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAsteriskEqualsNode } from "../../../models/nodes/operators/typescript-asterisk-equals.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";

TypeScriptAsteriskEqualsNode.prototype.isTypeScriptAssignmentOperator = function (this: TypeScriptAsteriskEqualsNode): boolean {
  return true;
};

TypeScriptAsteriskEqualsNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptAsteriskEqualsNode, parser: TypeParser): Node {
  return parser.parseWildcardTypeBeforeEquals();
};
