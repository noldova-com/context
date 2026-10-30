/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptPlusPlusNode } from "../../../models/nodes/operators/typescript-plus-plus.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptPlusPlusNode.prototype.isTypeScriptPrefixUnaryOperator = function (this: TypeScriptPlusPlusNode): boolean {
  return true;
};

TypeScriptPlusPlusNode.prototype.isTypeScriptUpdateOperator = function (this: TypeScriptPlusPlusNode): boolean {
  return true;
};

TypeScriptPlusPlusNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptPlusPlusNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePrefixUnaryExpression(this);
};
