/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDefaultClauseNode } from "../../../models/nodes/clauses/typescript-default-clause.node.js";
import { TypeScriptSwitchStatementNode } from "../../../models/nodes/statements/typescript-switch-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptSwitchStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptSwitchStatementNode,
  context: TypeScriptParserContext): void {
  let hasDefaultClause = false;
  for (const clauseNode of this.caseBlockNode.children) {
    if (!(clauseNode instanceof TypeScriptDefaultClauseNode))
      continue;
    if (hasDefaultClause) {
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1113, clauseNode.span);
      return;
    }
    hasDefaultClause = true;
  }
};

TypeScriptSwitchStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptSwitchStatementNode): SourceSpan {
  return this.switchKeywordNode.span;
};
