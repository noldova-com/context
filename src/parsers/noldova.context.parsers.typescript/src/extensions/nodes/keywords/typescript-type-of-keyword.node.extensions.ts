/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptTypeOfKeywordNode } from "../../../models/nodes/keywords/typescript-type-of-keyword.node.js";
import type { TypeParser } from "../../../services/parsers/types/type.parser.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTypeOfKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptTypeOfKeywordNode): boolean {
  return true;
};

TypeScriptTypeOfKeywordNode.prototype.parseTypeScriptUnaryExpression = function (this: TypeScriptTypeOfKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return parser.parseTypeOfExpression(this);
};

TypeScriptTypeOfKeywordNode.prototype.reportTypeScriptUnaryExponentiationDiagnostic = function (
  this: TypeScriptTypeOfKeywordNode,
  parser: TypeScriptSyntaxParser,
  expressionNode: Node): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS17006, expressionNode.span, [this.value]);
};

TypeScriptTypeOfKeywordNode.prototype.canStartTypeScriptType = function (this: TypeScriptTypeOfKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptTypeOfKeywordNode.prototype.parseTypeScriptPrimaryType = function (this: TypeScriptTypeOfKeywordNode, parser: TypeParser): Node {
  return parser.parseQueryOrImportType(this);
};
