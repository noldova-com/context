/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptNamespaceExportDeclarationNode } from "../../../models/nodes/declarations/typescript-namespace-export-declaration.node.js";
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptNamespaceExportDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptNamespaceExportDeclarationNode): boolean {
  return this.modifierNodes.some(t => t instanceof TypeScriptExportKeywordNode);
};

TypeScriptNamespaceExportDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptNamespaceExportDeclarationNode,
  context: TypeScriptParserContext): void {
  context.records.uncheckedSpans.push(this.span);
  if (this.modifierNodes.length !== 0)
    context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1184, this.span);

  if (context.isModuleStatementList && !context.isModuleBody) {
    context.records.writtenGlobalExports.push(this);
    return;
  }

  context.diagnosticCollector.addTypeScriptBinderDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1316, this.span);
};

TypeScriptNamespaceExportDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptNamespaceExportDeclarationNode): boolean {
  return true;
};

TypeScriptNamespaceExportDeclarationNode.prototype.readsTypeScriptModifierListItself = function (this: TypeScriptNamespaceExportDeclarationNode): boolean {
  return true;
};
