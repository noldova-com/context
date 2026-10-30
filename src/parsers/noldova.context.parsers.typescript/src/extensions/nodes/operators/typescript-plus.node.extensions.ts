/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPlusNode } from "../../../models/nodes/operators/typescript-plus.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptPlusNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptPlusNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Additive;
};

TypeScriptPlusNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptPlusNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptPlusNode.prototype.isTypeScriptPrefixUnaryOperator = function (this: TypeScriptPlusNode): boolean {
  return true;
};

TypeScriptPlusNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptPlusNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePrefixUnaryExpression(this);
};

TypeScriptPlusNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptPlusNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};

TypeScriptPlusNode.prototype.canFollowTypeScriptTypeArguments = function (this: TypeScriptPlusNode): boolean {
  return false;
};
