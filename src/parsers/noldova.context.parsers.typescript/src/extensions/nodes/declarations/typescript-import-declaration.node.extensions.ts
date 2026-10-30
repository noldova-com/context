/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptImportDeclarationNode } from "../../../models/nodes/declarations/typescript-import-declaration.node.js";
import { TypeScriptNamedImportsNode } from "../../../models/nodes/declarations/typescript-named-imports.node.js";
import { TypeScriptDeclareKeywordNode } from "../../../models/nodes/keywords/typescript-declare-keyword.node.js";
import { TypeScriptDeferKeywordNode } from "../../../models/nodes/keywords/typescript-defer-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptImportDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptImportDeclarationNode): boolean {
  return true;
};

TypeScriptImportDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptImportDeclarationNode,
  context: TypeScriptParserContext): void {
  if (context.isNestedStatement || context.isSubstatement) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1232, this.importKeywordNode.span);
    return;
  }

  if (context.isNamespaceBody)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1147, this.moduleSpecifierNode.span);
  else if (!(this.moduleSpecifierNode instanceof TypeScriptStringLiteralNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1141, this.moduleSpecifierNode.span);

  const phaseKeywordNode = this.phaseKeywordNode;
  const clauseNode = this.importClauseNode;
  if (Object.isUndefined(phaseKeywordNode) || Object.isUndefined(clauseNode))
    return;

  let template: DiagnosticTemplate | undefined;
  if (phaseKeywordNode instanceof TypeScriptDeferKeywordNode) {
    if (!Object.isUndefined(clauseNode.defaultNameNode))
      template = TypeScriptDiagnosticTemplates.TS18058;
    else if (clauseNode.namedBindingsNode instanceof TypeScriptNamedImportsNode)
      template = TypeScriptDiagnosticTemplates.TS18059;
  }
  else if (!Object.isUndefined(clauseNode.defaultNameNode) && !Object.isUndefined(clauseNode.namedBindingsNode))
    template = TypeScriptDiagnosticTemplates.TS1363;

  if (!Object.isUndefined(template))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template,
      new SourceSpan(phaseKeywordNode.span.startOffset, clauseNode.span.endOffset - phaseKeywordNode.span.startOffset));
};

TypeScriptImportDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptImportDeclarationNode): boolean {
  return true;
};

TypeScriptImportDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptImportDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.Export | TypeScriptModifierFlags.Declare;
};

TypeScriptImportDeclarationNode.prototype.reportTypeScriptGrammarAfterModifiers = function (this: TypeScriptImportDeclarationNode,
  context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void {
  if (hasModifierDiagnostics || context.isNestedStatement || context.isSubstatement || this.modifierNodes.length === 0)
    return;

  const declareNode = this.modifierNodes.findLast(t => t instanceof TypeScriptDeclareKeywordNode);
  if (!Object.isUndefined(declareNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1079, declareNode.span,
      [context.source.getText(declareNode.span)]);
  else
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1191, this.modifierNodes[0]!.getTypeScriptFirstTokenSpan());
};
