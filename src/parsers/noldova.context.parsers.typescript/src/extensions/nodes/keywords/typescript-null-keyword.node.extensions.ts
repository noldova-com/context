/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNullKeywordNode } from "../../../models/nodes/keywords/typescript-null-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptNullKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptNullKeywordNode): boolean {
  return true;
};

TypeScriptNullKeywordNode.prototype.isTypeScriptLiteralTypeToken = function (this: TypeScriptNullKeywordNode): boolean {
  return true;
};

TypeScriptNullKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptNullKeywordNode, parser: TypeScriptSyntaxParser): TypeScriptNullKeywordNode {
  parser.advance();
  return this;
};

TypeScriptNullKeywordNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptNullKeywordNode): boolean {
  return true;
};

TypeScriptNullKeywordNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptNullKeywordNode): boolean {
  return true;
};

TypeScriptNullKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptNullKeywordNode, parser: TypeParser): Node {
  return parser.parseLiteralType();
};

TypeScriptNullKeywordNode.prototype.isTypeScriptNonArithmeticLiteral = function (this: TypeScriptNullKeywordNode): boolean {
  return true;
};
