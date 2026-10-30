/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExternalModuleReferenceNode } from "../../../models/nodes/declarations/typescript-external-module-reference.node.js";
import { TypeScriptImportEqualsDeclarationNode } from "../../../models/nodes/declarations/typescript-import-equals-declaration.node.js";
import { TypeScriptDeclareKeywordNode } from "../../../models/nodes/keywords/typescript-declare-keyword.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptImportEqualsDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptImportEqualsDeclarationNode): boolean {
  return this.moduleReferenceNode instanceof TypeScriptExternalModuleReferenceNode || this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptImportEqualsDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptImportEqualsDeclarationNode, context: TypeScriptParserContext): void {
  if (context.isNestedStatement || context.isSubstatement) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1232, this.importKeywordNode.span);
    return;
  }

  if (this.moduleReferenceNode instanceof TypeScriptExternalModuleReferenceNode) {
    const moduleSpecifierNode = this.moduleReferenceNode.moduleSpecifierNode;
    if (context.isNamespaceBody)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1147, moduleSpecifierNode.span);
    else if (!(moduleSpecifierNode instanceof TypeScriptStringLiteralNode))
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1141, moduleSpecifierNode.span);
    else if (Object.isUndefined(this.typeKeywordNode) && !context.isModuleBody && !context.isAmbient)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1202, this.span);
  }
  else if (!Object.isUndefined(this.typeKeywordNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1392, this.span);
};

TypeScriptImportEqualsDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptImportEqualsDeclarationNode): boolean {
  return true;
};

TypeScriptImportEqualsDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptImportEqualsDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.Export | TypeScriptModifierFlags.Declare;
};

TypeScriptImportEqualsDeclarationNode.prototype.reportTypeScriptGrammarAfterModifiers = function (this: TypeScriptImportEqualsDeclarationNode,
  context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void {
  if (hasModifierDiagnostics || context.isNestedStatement || context.isSubstatement)
    return;

  const declareNode = this.modifierNodes.findLast(t => t instanceof TypeScriptDeclareKeywordNode);
  if (!Object.isUndefined(declareNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1079, declareNode.span,
      [context.source.getText(declareNode.span)]);
};
