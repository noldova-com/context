/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptWithStatementNode } from "../../../models/nodes/statements/typescript-with-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptWithStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptWithStatementNode,
  context: TypeScriptParserContext): void {
  context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1101, this.withKeywordNode.span);
};

TypeScriptWithStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptWithStatementNode): SourceSpan {
  return this.withKeywordNode.span;
};
