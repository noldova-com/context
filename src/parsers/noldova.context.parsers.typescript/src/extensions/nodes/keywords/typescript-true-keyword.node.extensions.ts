/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTrueKeywordNode } from "../../../models/nodes/keywords/typescript-true-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTrueKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptTrueKeywordNode): boolean {
  return true;
};

TypeScriptTrueKeywordNode.prototype.isTypeScriptLiteralTypeToken = function (this: TypeScriptTrueKeywordNode): boolean {
  return true;
};

TypeScriptTrueKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptTrueKeywordNode, parser: TypeScriptSyntaxParser): TypeScriptTrueKeywordNode {
  parser.advance();
  return this;
};

TypeScriptTrueKeywordNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptTrueKeywordNode): boolean {
  return true;
};

TypeScriptTrueKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptTrueKeywordNode): boolean {
  return true;
};

TypeScriptTrueKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptTrueKeywordNode, parser: TypeParser): Node {
  return parser.parseLiteralType();
};

TypeScriptTrueKeywordNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptTrueKeywordNode): boolean {
  return true;
};
