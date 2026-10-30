/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExportAssignmentNode } from "../../../models/nodes/declarations/typescript-export-assignment.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptExportAssignmentNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptExportAssignmentNode): boolean {
  return true;
};

TypeScriptExportAssignmentNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptExportAssignmentNode, context: TypeScriptParserContext): void {
  if (!(this.assignmentTokenNode instanceof TypeScriptEqualsNode)) {
    if (context.isNestedStatement || context.isSubstatement)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1258, this.exportKeywordNode.span);
    else if (context.isNamespaceBody && context.isModuleStatementList)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1319, this.span);

    return;
  }

  if (context.isNestedStatement || context.isSubstatement)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1231, this.exportKeywordNode.span);
  else if (context.isNamespaceBody)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1063, this.span);
  else if (context.isAmbient ? context.isEsModuleFile : !context.isCommonJsFile)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1203, this.span);
};

TypeScriptExportAssignmentNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptExportAssignmentNode): boolean {
  return true;
};

TypeScriptExportAssignmentNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptExportAssignmentNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.Export | TypeScriptModifierFlags.Declare;
};

TypeScriptExportAssignmentNode.prototype.reportTypeScriptGrammarAfterModifiers = function (this: TypeScriptExportAssignmentNode,
  context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void {
  if (hasModifierDiagnostics || context.isNestedStatement || context.isSubstatement || context.isNamespaceBody || this.modifierNodes.length === 0)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1120, this.modifierNodes[0]!.getTypeScriptFirstTokenSpan());
};
