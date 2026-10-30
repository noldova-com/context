/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptComputedPropertyNameNode } from "../../../models/nodes/declarations/typescript-computed-property-name.node.js";
import { TypeScriptEnumMemberNode } from "../../../models/nodes/declarations/typescript-enum-member.node.js";
import { TypeScriptPrivateIdentifierNode } from "../../../models/nodes/identifiers/typescript-private-identifier.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptEnumMemberNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptEnumMemberNode,
  context: TypeScriptParserContext): void {
  if (this.nameNode instanceof TypeScriptPrivateIdentifierNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS18024, this.nameNode.span);
  else if (this.nameNode instanceof TypeScriptComputedPropertyNameNode
    && !this.nameNode.expressionNode.isTypeScriptStringOrNumericLiteral())
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1164, this.nameNode.span);
};
