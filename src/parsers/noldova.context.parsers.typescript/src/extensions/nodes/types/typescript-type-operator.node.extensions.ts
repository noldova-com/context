/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptSymbolKeywordNode } from "../../../models/nodes/keywords/typescript-symbol-keyword.node.js";
import { TypeScriptUniqueKeywordNode } from "../../../models/nodes/keywords/typescript-unique-keyword.node.js";
import { TypeScriptTypeOperatorNode } from "../../../models/nodes/types/typescript-type-operator.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

TypeScriptTypeOperatorNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptTypeOperatorNode, context: TypeScriptParserContext): void {
  if (this.operatorNode instanceof TypeScriptUniqueKeywordNode && !Object.isUndefined(this.typeNode) && !(this.typeNode instanceof TypeScriptSymbolKeywordNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1005, this.typeNode.span, [Resources.symbol]);
};
