/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptTypeArgumentListNode } from "../../../models/nodes/types/typescript-type-argument-list.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptTypeArgumentListNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptTypeArgumentListNode,
  context: TypeScriptParserContext): void {
  const trailingCommaNode = this.getTypeScriptTrailingComma();
  if (!Object.isUndefined(trailingCommaNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1009, trailingCommaNode.span);
  else if (this.children.length === 0)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1099, this.span);
};
