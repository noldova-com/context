/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptLabeledStatementNode } from "../../../models/nodes/statements/typescript-labeled-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptLabeledStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptLabeledStatementNode,
  context: TypeScriptParserContext): void {
  if (this.statementNode.isTypeScriptDeclarationStatement())
    context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1344, this.labelNode.span);
};

TypeScriptLabeledStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptLabeledStatementNode): SourceSpan {
  return this.labelNode.getTypeScriptFirstTokenSpan();
};
