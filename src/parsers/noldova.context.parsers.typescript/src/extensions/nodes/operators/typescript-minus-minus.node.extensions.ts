/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptMinusMinusNode } from "../../../models/nodes/operators/typescript-minus-minus.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptMinusMinusNode.prototype.isTypeScriptPrefixUnaryOperator = function (this: TypeScriptMinusMinusNode): boolean {
  return true;
};

TypeScriptMinusMinusNode.prototype.isTypeScriptUpdateOperator = function (this: TypeScriptMinusMinusNode): boolean {
  return true;
};

TypeScriptMinusMinusNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptMinusMinusNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePrefixUnaryExpression(this);
};
