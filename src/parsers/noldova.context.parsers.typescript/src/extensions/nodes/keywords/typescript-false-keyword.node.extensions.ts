/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptFalseKeywordNode } from "../../../models/nodes/keywords/typescript-false-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptFalseKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptFalseKeywordNode): boolean {
  return true;
};

TypeScriptFalseKeywordNode.prototype.isTypeScriptLiteralTypeToken = function (this: TypeScriptFalseKeywordNode): boolean {
  return true;
};

TypeScriptFalseKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptFalseKeywordNode, parser: TypeScriptSyntaxParser): TypeScriptFalseKeywordNode {
  parser.advance();
  return this;
};

TypeScriptFalseKeywordNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptFalseKeywordNode): boolean {
  return true;
};

TypeScriptFalseKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptFalseKeywordNode): boolean {
  return true;
};

TypeScriptFalseKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptFalseKeywordNode, parser: TypeParser): Node {
  return parser.parseLiteralType();
};

TypeScriptFalseKeywordNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptFalseKeywordNode): boolean {
  return true;
};
