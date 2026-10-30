/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptThisKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptThisKeywordNode): boolean {
  return true;
};

TypeScriptThisKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptThisKeywordNode, parser: TypeScriptSyntaxParser): TypeScriptThisKeywordNode {
  parser.advance();
  return this;
};

TypeScriptThisKeywordNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptThisKeywordNode): boolean {
  return true;
};

TypeScriptThisKeywordNode.prototype.canStartTypeScriptType = function (this: TypeScriptThisKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptThisKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptThisKeywordNode): boolean {
  return true;
};

TypeScriptThisKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptThisKeywordNode, parser: TypeParser): Node {
  return parser.parseThisType(this);
};
