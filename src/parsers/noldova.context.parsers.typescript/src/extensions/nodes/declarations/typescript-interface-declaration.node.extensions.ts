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
import { TypeScriptInterfaceDeclarationNode } from "../../../models/nodes/declarations/typescript-interface-declaration.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptImplementsKeywordNode } from "../../../models/nodes/keywords/typescript-implements-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

TypeScriptInterfaceDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptInterfaceDeclarationNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptInterfaceDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptInterfaceDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Abstract | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor);
};

TypeScriptInterfaceDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptInterfaceDeclarationNode, context: TypeScriptParserContext): void {
  if (this.nameNode instanceof TypeScriptMissingIdentifierNode)
    return;

  if (context.isSubstatement) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1156, this.nameNode.span, [Resources.interface]);
    return;
  }

  this.nameNode.reportTypeScriptReservedTypeName(context, TypeScriptDiagnosticTemplates.TS2427);

  let hasExtendsClause = false;
  for (const clauseNode of this.heritageClauseNodes) {
    if (clauseNode.keywordNode instanceof TypeScriptImplementsKeywordNode) {
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1176, clauseNode.keywordNode.span);
      return;
    }
    if (hasExtendsClause) {
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1172, clauseNode.keywordNode.span);
      return;
    }
    hasExtendsClause = true;
  }
};

TypeScriptInterfaceDeclarationNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptInterfaceDeclarationNode,
  context: TypeScriptParserContext): DiagnosticTemplate | undefined {
  return context.isModuleStatementList ? undefined : TypeScriptDiagnosticTemplates.TS1184;
};

TypeScriptInterfaceDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptInterfaceDeclarationNode): boolean {
  return true;
};
