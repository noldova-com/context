/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptEnumDeclarationNode } from "../../../models/nodes/declarations/typescript-enum-declaration.node.js";
import { TypeScriptConstKeywordNode } from "../../../models/nodes/keywords/typescript-const-keyword.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptEnumDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptEnumDeclarationNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptEnumDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptEnumDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Abstract | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor);
};

TypeScriptEnumDeclarationNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptEnumDeclarationNode,
  context: TypeScriptParserContext, modifierNode: Node): DiagnosticTemplate | undefined {
  return context.isModuleStatementList || modifierNode instanceof TypeScriptConstKeywordNode
    ? undefined
    : TypeScriptDiagnosticTemplates.TS1184;
};

TypeScriptEnumDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptEnumDeclarationNode, context: TypeScriptParserContext): void {
  this.nameNode.reportTypeScriptReservedTypeName(context, TypeScriptDiagnosticTemplates.TS2431);
};

TypeScriptEnumDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptEnumDeclarationNode): boolean {
  return true;
};

TypeScriptEnumDeclarationNode.prototype.requiresTypeScriptDeclareModifier = function (this: TypeScriptEnumDeclarationNode): boolean {
  return !this.modifierNodes.some(t => t.isTypeScriptDeclarationFileModifier());
};

TypeScriptEnumDeclarationNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptEnumDeclarationNode): SourceSpan {
  return this.modifierNodes[0]?.getTypeScriptFirstTokenSpan() ?? this.enumKeywordNode.span;
};
