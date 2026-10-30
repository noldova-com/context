/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptTypeAliasDeclarationNode } from "../../../models/nodes/declarations/typescript-type-alias-declaration.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

TypeScriptTypeAliasDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptTypeAliasDeclarationNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptTypeAliasDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptTypeAliasDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Abstract | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor);
};

TypeScriptTypeAliasDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptTypeAliasDeclarationNode, context: TypeScriptParserContext): void {
  if (this.nameNode instanceof TypeScriptMissingIdentifierNode)
    return;

  if (context.isSubstatement)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1156, this.nameNode.span, [Resources.type]);
  else
    this.nameNode.reportTypeScriptReservedTypeName(context, TypeScriptDiagnosticTemplates.TS2457);
};

TypeScriptTypeAliasDeclarationNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptTypeAliasDeclarationNode,
  context: TypeScriptParserContext): DiagnosticTemplate | undefined {
  return context.isModuleStatementList ? undefined : TypeScriptDiagnosticTemplates.TS1184;
};

TypeScriptTypeAliasDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptTypeAliasDeclarationNode): boolean {
  return true;
};
