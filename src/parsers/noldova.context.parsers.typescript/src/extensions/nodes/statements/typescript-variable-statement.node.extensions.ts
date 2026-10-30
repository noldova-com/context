/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDeclarationListHolder } from "../../../enums/typescript-declaration-list-holder.js";
import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptUsingKeywordNode } from "../../../models/nodes/keywords/typescript-using-keyword.node.js";
import { TypeScriptVarKeywordNode } from "../../../models/nodes/keywords/typescript-var-keyword.node.js";
import { TypeScriptVariableStatementNode } from "../../../models/nodes/statements/typescript-variable-statement.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptVariableStatementNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptVariableStatementNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptVariableStatementNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptVariableStatementNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Abstract | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor);
};

TypeScriptVariableStatementNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptVariableStatementNode, context: TypeScriptParserContext): void {
  const listNode = this.declarationListNode;
  listNode.readTypeScriptDeclarations(context, TypeScriptDeclarationListHolder.Statement);
  if (listNode.keywordNode instanceof TypeScriptVarKeywordNode)
    return;

  if (listNode.keywordNode instanceof TypeScriptUsingKeywordNode && context.isAmbient && this.modifierNodes.length === 0)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      Object.isUndefined(listNode.awaitKeywordNode) ? TypeScriptDiagnosticTemplates.TS1545 : TypeScriptDiagnosticTemplates.TS1546, listNode.span);
  else if (context.isSubstatement && (this.modifierNodes.length === 0 || context.isModuleStatementList))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1156, this.span,
      [listNode.getTypeScriptKeywordText()]);
  else if (context.isCaseClause && listNode.keywordNode instanceof TypeScriptUsingKeywordNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      Object.isUndefined(listNode.awaitKeywordNode) ? TypeScriptDiagnosticTemplates.TS1547 : TypeScriptDiagnosticTemplates.TS1548, listNode.span);
};

TypeScriptVariableStatementNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptVariableStatementNode,
  context: TypeScriptParserContext): DiagnosticTemplate | undefined {
  if (!(this.declarationListNode.keywordNode instanceof TypeScriptUsingKeywordNode))
    return context.isModuleStatementList ? undefined : TypeScriptDiagnosticTemplates.TS1184;

  return Object.isUndefined(this.declarationListNode.awaitKeywordNode)
    ? TypeScriptDiagnosticTemplates.TS1491
    : TypeScriptDiagnosticTemplates.TS1495;
};

TypeScriptVariableStatementNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptVariableStatementNode): boolean {
  return true;
};

TypeScriptVariableStatementNode.prototype.requiresTypeScriptDeclareModifier = function (this: TypeScriptVariableStatementNode): boolean {
  return !this.modifierNodes.some(t => t.isTypeScriptDeclarationFileModifier());
};

TypeScriptVariableStatementNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptVariableStatementNode): SourceSpan {
  return this.modifierNodes[0]?.getTypeScriptFirstTokenSpan() ?? this.declarationListNode.getTypeScriptFirstTokenSpan();
};
