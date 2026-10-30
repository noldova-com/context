/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptMissingExpressionNode } from "../../../models/nodes/expressions/typescript-missing-expression.node.js";
import { TypeScriptThrowStatementNode } from "../../../models/nodes/statements/typescript-throw-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptThrowStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptThrowStatementNode, context: TypeScriptParserContext): void {
  if (this.expressionNode instanceof TypeScriptMissingExpressionNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1142, new SourceSpan(this.throwKeywordNode.span.endOffset, 0));
};

TypeScriptThrowStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptThrowStatementNode): SourceSpan {
  return this.throwKeywordNode.span;
};
