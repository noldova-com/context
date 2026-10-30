/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptComputedPropertyNameNode } from "../../../models/nodes/declarations/typescript-computed-property-name.node.js";
import { TypeScriptPropertySignatureNode } from "../../../models/nodes/declarations/typescript-property-signature.node.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptPropertySignatureNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptPropertySignatureNode, context: TypeScriptParserContext): void {
  if (this.nameNode instanceof TypeScriptPrivateIdentifierNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18016, this.nameNode.span);
};

TypeScriptPropertySignatureNode.prototype.reportTypeScriptSignatureInitializer = function (this: TypeScriptPropertySignatureNode,
  context: TypeScriptParserContext, isInterface: boolean): void {
  if (!Object.isUndefined(this.initializerNode) && !(this.nameNode instanceof TypeScriptComputedPropertyNameNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      isInterface ? TypeScriptDiagnosticTemplates.TS1246 : TypeScriptDiagnosticTemplates.TS1247, this.initializerNode.span);
};
