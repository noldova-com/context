/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptTaggedTemplateExpressionNode } from "../../../models/nodes/expressions/typescript-tagged-template-expression.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptTaggedTemplateExpressionNode.prototype.reportTypeScriptMissingSemicolon = function (this: TypeScriptTaggedTemplateExpressionNode, parser: TypeScriptSyntaxParser): void {
  parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1443, this.templateNode.span);
};

TypeScriptTaggedTemplateExpressionNode.prototype.isTypeScriptLeftHandSideExpression = function (this: TypeScriptTaggedTemplateExpressionNode): boolean {
  return true;
};

TypeScriptTaggedTemplateExpressionNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptTaggedTemplateExpressionNode, context: TypeScriptParserContext): void {
  if (!Object.isUndefined(this.questionDotNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1358, this.templateNode.span);
};

TypeScriptTaggedTemplateExpressionNode.prototype.validateTypeScriptOptionalChain = function (
  this: TypeScriptTaggedTemplateExpressionNode, context: TypeScriptParserContext): void {
  if (Object.isUndefined(this.questionDotNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1358, this.templateNode.span);
};

TypeScriptTaggedTemplateExpressionNode.prototype.getTypeScriptFirstChild = function (this: TypeScriptTaggedTemplateExpressionNode): Node {
  return this.tagNode;
};
