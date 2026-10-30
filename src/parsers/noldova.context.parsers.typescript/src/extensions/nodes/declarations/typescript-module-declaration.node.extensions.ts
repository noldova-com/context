/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptModuleDeclarationNode } from "../../../models/nodes/declarations/typescript-module-declaration.node.js";
import { TypeScriptQualifiedNameNode } from "../../../models/nodes/identifiers/typescript-qualified-name.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptGlobalKeywordNode } from "../../../models/nodes/keywords/typescript-global-keyword.node.js";
import { TypeScriptModuleKeywordNode } from "../../../models/nodes/keywords/typescript-module-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptModuleDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptModuleDeclarationNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptModuleDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptModuleDeclarationNode, context: TypeScriptParserContext): void {
  if (context.isNestedStatement || context.isSubstatement) {
    const namesAnExternalModule = this.keywordNode instanceof TypeScriptGlobalKeywordNode || this.nameNode instanceof TypeScriptStringLiteralNode;
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
      namesAnExternalModule ? TypeScriptDiagnosticTemplates.TS1234 : TypeScriptDiagnosticTemplates.TS1235,
      this.getTypeScriptFirstTokenSpan());
    return;
  }

  if (!(this.keywordNode instanceof TypeScriptModuleKeywordNode) || Object.isUndefined(this.nameNode))
    return;

  if (this.nameNode instanceof TypeScriptStringLiteralNode) {
    if (!context.isAmbient)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1035, this.nameNode.span);
    return;
  }

  let nameNode: Node = this.nameNode;
  for (; nameNode instanceof TypeScriptQualifiedNameNode; nameNode = nameNode.leftNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1540, nameNode.rightNode.span);
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1540, nameNode.span);
};

TypeScriptModuleDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptModuleDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async | TypeScriptModifierFlags.Abstract | TypeScriptModifierFlags.Readonly | TypeScriptModifierFlags.Accessor);
};

TypeScriptModuleDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptModuleDeclarationNode): boolean {
  return true;
};

TypeScriptModuleDeclarationNode.prototype.requiresTypeScriptDeclareModifier = function (this: TypeScriptModuleDeclarationNode): boolean {
  return !this.modifierNodes.some(t => t.isTypeScriptDeclarationFileModifier());
};

TypeScriptModuleDeclarationNode.prototype.getTypeScriptFirstTokenSpan = function (this: TypeScriptModuleDeclarationNode): SourceSpan {
  return this.modifierNodes[0]?.getTypeScriptFirstTokenSpan() ?? this.keywordNode.span;
};
