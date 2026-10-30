/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDeleteKeywordNode } from "../../../models/nodes/keywords/typescript-delete-keyword.node.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptDeleteKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptDeleteKeywordNode): boolean {
  return true;
};

TypeScriptDeleteKeywordNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptDeleteKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseDeleteExpression(this);
};

TypeScriptDeleteKeywordNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptDeleteKeywordNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};
