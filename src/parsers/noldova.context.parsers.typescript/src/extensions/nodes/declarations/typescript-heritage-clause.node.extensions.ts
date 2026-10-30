/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptHeritageClauseNode } from "../../../models/nodes/declarations/typescript-heritage-clause.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptHeritageClauseNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptHeritageClauseNode,
  context: TypeScriptParserContext): void {
  const trailingCommaNode = this.getTypeScriptTrailingComma();
  if (!Object.isUndefined(trailingCommaNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1009, trailingCommaNode.span);
  else if (this.children.length === 0)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1097,
      new SourceSpan(this.keywordNode.span.endOffset, 0), [this.keywordNode.value]);
};
