/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDecoratorSupport } from "../../../enums/typescript-decorator-support.js";
import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptClassDeclarationNode } from "../../../models/nodes/declarations/typescript-class-declaration.node.js";
import { TypeScriptAbstractKeywordNode } from "../../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptDefaultKeywordNode } from "../../../models/nodes/keywords/typescript-default-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptClassDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptClassDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor);
};

TypeScriptClassDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptClassDeclarationNode, context: TypeScriptParserContext): void {
  if (Object.isUndefined(this.nameNode) && !this.modifierNodes.some(t => t instanceof TypeScriptDefaultKeywordNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1211,
      this.getTypeScriptFirstTokenSpan());
  this.nameNode?.reportTypeScriptReservedTypeName(context, TypeScriptDiagnosticTemplates.TS2414);
  this.reportTypeScriptHeritageClauses(context);
};

TypeScriptClassDeclarationNode.prototype.getTypeScriptDecoratorSupport = function (this: TypeScriptClassDeclarationNode): TypeScriptDecoratorSupport {
  return TypeScriptDecoratorSupport.Supported;
};

TypeScriptClassDeclarationNode.prototype.getTypeScriptModifierRejection = function (this: TypeScriptClassDeclarationNode,
  context: TypeScriptParserContext, modifierNode: Node): DiagnosticTemplate | undefined {
  return context.isModuleStatementList || modifierNode instanceof TypeScriptAbstractKeywordNode
    ? undefined
    : TypeScriptDiagnosticTemplates.TS1184;
};

TypeScriptClassDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptClassDeclarationNode): boolean {
  return true;
};

TypeScriptClassDeclarationNode.prototype.requiresTypeScriptDeclareModifier = function (this: TypeScriptClassDeclarationNode): boolean {
  return !this.modifierNodes.some(t => t.isTypeScriptDeclarationFileModifier());
};

TypeScriptClassDeclarationNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptClassDeclarationNode): SourceSpan {
  return this.modifierNodes[0]?.getTypeScriptFirstTokenSpan() ?? this.classKeywordNode.span;
};
