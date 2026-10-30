/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDeleteExpressionNode } from "../../../models/nodes/expressions/typescript-delete-expression.node.js";
import { TypeScriptIdentifierNode } from "../../../models/nodes/identifiers/typescript-identifier.node.js";
import { TypeScriptUndefinedKeywordNode } from "../../../models/nodes/keywords/typescript-undefined-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptDeleteExpressionNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptDeleteExpressionNode,
  context: TypeScriptParserContext): void {
  if (this.expressionNode instanceof TypeScriptIdentifierNode || this.expressionNode instanceof TypeScriptUndefinedKeywordNode)
    context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1102, this.expressionNode.span);
  const operandNode = this.expressionNode.getTypeScriptUnparenthesizedExpression();
  if (!operandNode.isTypeScriptAccessExpression())
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2703, operandNode.span);
};

TypeScriptDeleteExpressionNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptDeleteExpressionNode): SourceSpan {
  return this.deleteKeywordNode.span;
};
