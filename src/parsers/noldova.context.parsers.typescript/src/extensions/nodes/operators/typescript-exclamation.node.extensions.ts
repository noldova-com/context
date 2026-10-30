/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptExclamationNode.prototype.isTypeScriptPrefixUnaryOperator = function (this: TypeScriptExclamationNode): boolean {
  return true;
};

TypeScriptExclamationNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptExclamationNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parsePrefixUnaryExpression(this);
};

TypeScriptExclamationNode.prototype.parseTypeScriptMemberSuffix = function (
  this: TypeScriptExclamationNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): Node | undefined {
  return parser.hasPrecedingLineBreak() ? undefined : parser.parseNonNullExpression(expressionNode, this);
};

TypeScriptExclamationNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptExclamationNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};

TypeScriptExclamationNode.prototype.canStartTypeScriptType = function (this: TypeScriptExclamationNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptExclamationNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptExclamationNode, parser: TypeParser): Node {
  return parser.parseNonNullableType();
};

declare module "../../../models/nodes/operators/typescript-exclamation.node.js" {
  interface TypeScriptExclamationNode {
    reportTypeScriptObjectMemberMarker(context: TypeScriptParserContext): void;
  }
}

TypeScriptExclamationNode.prototype.reportTypeScriptObjectMemberMarker = function (this: TypeScriptExclamationNode, context: TypeScriptParserContext): void {
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1255, this.span);
};
