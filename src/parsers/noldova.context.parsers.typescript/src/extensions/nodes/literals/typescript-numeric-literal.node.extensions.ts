/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNumericLiteralNode } from "../../../models/nodes/literals/typescript-numeric-literal.node.js";
import { Resources } from "../../../resources.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptNumericLiteralNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptNumericLiteralNode): boolean {
  return true;
};

TypeScriptNumericLiteralNode.prototype.getTypeScriptDiagnosticText = function (this: TypeScriptNumericLiteralNode): string {
  const text = this.value.replaceAll(Resources.numericSeparator, String.empty).toLowerCase();
  const prefix = text.slice(0, Resources.numericBasePrefixLength);
  if (prefix === Resources.hexadecimalPrefixLowercase || prefix === Resources.binaryPrefixLowercase || prefix === Resources.octalPrefixLowercase)
    return String(Number(text.length === prefix.length ? text + Resources.digitZero : text));
  if (!this.value.includes(Resources.numericSeparator) && Resources.legacyOctalLiteralPattern.test(text))
    return String(Number(Resources.octalPrefixLowercase + text));
  return String(Number.parseFloat(text));
};

TypeScriptNumericLiteralNode.prototype.canFollowTypeScriptUnscopedAwaitOrYield = function (this: TypeScriptNumericLiteralNode): boolean {
  return true;
};

TypeScriptNumericLiteralNode.prototype.isTypeScriptLiteralTypeToken = function (this: TypeScriptNumericLiteralNode): boolean {
  return true;
};

TypeScriptNumericLiteralNode.prototype.canStartTypeScriptPropertyName = function (this: TypeScriptNumericLiteralNode): boolean {
  return true;
};

TypeScriptNumericLiteralNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptNumericLiteralNode, parser: TypeScriptSyntaxParser): TypeScriptNumericLiteralNode {
  parser.advance();
  return this;
};

TypeScriptNumericLiteralNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptNumericLiteralNode): boolean {
  return true;
};

TypeScriptNumericLiteralNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptNumericLiteralNode): boolean {
  return true;
};

TypeScriptNumericLiteralNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptNumericLiteralNode, parser: TypeParser): Node {
  return parser.parseLiteralType();
};

TypeScriptNumericLiteralNode.prototype.isTypeScriptStringOrNumericLiteral = function (this: TypeScriptNumericLiteralNode): boolean {
  return true;
};
