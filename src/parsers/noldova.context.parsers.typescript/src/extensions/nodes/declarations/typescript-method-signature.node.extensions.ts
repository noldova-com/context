/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptMethodSignatureNode } from "../../../models/nodes/declarations/typescript-method-signature.node.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptMethodSignatureNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptMethodSignatureNode, context: TypeScriptParserContext): void {
  if (this.nameNode instanceof TypeScriptPrivateIdentifierNode && !context.hasEnclosingClass)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18016, this.span);
};
