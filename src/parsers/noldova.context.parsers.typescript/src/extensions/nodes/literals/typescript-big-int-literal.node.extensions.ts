/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptBigIntLiteralNode } from "../../../models/nodes/literals/typescript-big-int-literal.node.js";
import { Resources } from "../../../resources.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptBigIntLiteralNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptBigIntLiteralNode): boolean {
  return true;
};

TypeScriptBigIntLiteralNode.prototype.getTypeScriptDiagnosticText = function (this: TypeScriptBigIntLiteralNode): string {
  const text = this.value.replaceAll(Resources.numericSeparator, String.empty).toLowerCase();
  const prefix = text.slice(0, Resources.numericBasePrefixLength);
  if (prefix === Resources.binaryPrefixLowercase || prefix === Resources.octalPrefixLowercase) {
    const digits = text.slice(0, -Resources.bigIntSuffix.length);
    return String(BigInt(digits.length === prefix.length ? digits + Resources.digitZero : digits)) + Resources.bigIntSuffix;
  }
  if (prefix === Resources.hexadecimalPrefixLowercase && text.length === prefix.length + Resources.bigIntSuffix.length)
    return prefix + Resources.digitZero + Resources.bigIntSuffix;
  return text;
};

TypeScriptBigIntLiteralNode.prototype.canFollowTypeScriptUnscopedAwaitOrYield = function (this: TypeScriptBigIntLiteralNode): boolean {
  return true;
};

TypeScriptBigIntLiteralNode.prototype.isTypeScriptLiteralTypeToken = function (this: TypeScriptBigIntLiteralNode): boolean {
  return true;
};

TypeScriptBigIntLiteralNode.prototype.canStartTypeScriptPropertyName = function (this: TypeScriptBigIntLiteralNode): boolean {
  return true;
};

TypeScriptBigIntLiteralNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptBigIntLiteralNode, parser: TypeScriptSyntaxParser): TypeScriptBigIntLiteralNode {
  parser.advance();
  return this;
};

TypeScriptBigIntLiteralNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptBigIntLiteralNode): boolean {
  return true;
};

TypeScriptBigIntLiteralNode.prototype.canStartTypeScriptLeftHandSideExpression = function (this: TypeScriptBigIntLiteralNode): boolean {
  return true;
};

TypeScriptBigIntLiteralNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptBigIntLiteralNode, parser: TypeParser): Node {
  return parser.parseLiteralType();
};
