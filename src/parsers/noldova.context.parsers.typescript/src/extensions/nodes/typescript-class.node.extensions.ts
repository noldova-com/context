/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExportKeywordNode } from "../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptExtendsKeywordNode } from "../../models/nodes/keywords/typescript-extends-keyword.node.js";
import { TypeScriptClassNode } from "../../models/nodes/typescript-class.node.js";
import type { TypeScriptParserContext } from "../../models/typescript-parser-context.js";

declare module "../../models/nodes/typescript-class.node.js" {
  interface TypeScriptClassNode {
    reportTypeScriptHeritageClauses(context: TypeScriptParserContext): void;
  }
}

TypeScriptClassNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptClassNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptClassNode.prototype.reportTypeScriptHeritageClauses = function (this: TypeScriptClassNode, context: TypeScriptParserContext): void {
  let hasExtendsClause = false;
  let hasImplementsClause = false;
  for (const clauseNode of this.heritageClauseNodes)
    if (clauseNode.keywordNode instanceof TypeScriptExtendsKeywordNode) {
      if (hasExtendsClause || hasImplementsClause) {
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
          hasExtendsClause ? TypeScriptDiagnosticTemplates.TS1172 : TypeScriptDiagnosticTemplates.TS1173, clauseNode.keywordNode.span);
        return;
      }
      const secondNode = clauseNode.children[1];
      if (!Object.isUndefined(secondNode)) {
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1174, secondNode.getTypeScriptFirstTokenSpan());
        return;
      }
      hasExtendsClause = true;
    }
    else {
      if (hasImplementsClause) {
        context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1175, clauseNode.keywordNode.span);
        return;
      }
      hasImplementsClause = true;
    }
};
