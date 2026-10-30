/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptVoidKeywordNode } from "../../../models/nodes/keywords/typescript-void-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptVoidKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptVoidKeywordNode): boolean {
  return true;
};

TypeScriptVoidKeywordNode.prototype.isTypeScriptPredefinedTypeKeyword = function (this: TypeScriptVoidKeywordNode): boolean {
  return true;
};

TypeScriptVoidKeywordNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptVoidKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseVoidExpression(this);
};

TypeScriptVoidKeywordNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptVoidKeywordNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};

TypeScriptVoidKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptVoidKeywordNode, parser: TypeParser): Node {
  return parser.parsePredefinedType(this);
};
