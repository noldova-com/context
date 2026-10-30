/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptReturnStatementNode } from "../../../models/nodes/statements/typescript-return-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptReturnStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptReturnStatementNode,
  context: TypeScriptParserContext): void {
  if (context.isClassStaticBlock)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18041, this.returnKeywordNode.span);
  else if (!context.isFunctionScope && !(context.isAmbient && !context.hasReportedAmbientStatement))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1108, this.returnKeywordNode.span);
};

TypeScriptReturnStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptReturnStatementNode): SourceSpan {
  return this.returnKeywordNode.span;
};
