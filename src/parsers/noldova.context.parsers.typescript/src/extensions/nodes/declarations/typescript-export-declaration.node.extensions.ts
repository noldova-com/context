/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptExportDeclarationNode } from "../../../models/nodes/declarations/typescript-export-declaration.node.js";
import { TypeScriptNamedExportsNode } from "../../../models/nodes/declarations/typescript-named-exports.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptExportDeclarationNode.prototype.isTypeScriptExternalModuleIndicator = function (this: TypeScriptExportDeclarationNode): boolean {
  return true;
};

TypeScriptExportDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptExportDeclarationNode,
  context: TypeScriptParserContext): void {
  if (context.isNestedStatement || context.isSubstatement) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1233, this.exportKeywordNode.span);
    return;
  }

  if (context.isNamespaceBody)
    if (this.moduleSpecifierNode instanceof TypeScriptStringLiteralNode)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1194, this.moduleSpecifierNode.span);
    else if (Object.isUndefined(this.moduleSpecifierNode) && !context.isAmbient)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1194, this.span);

  if (!Object.isUndefined(this.moduleSpecifierNode) && !(this.moduleSpecifierNode instanceof TypeScriptStringLiteralNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1141, this.moduleSpecifierNode.span);

  if (!Object.isUndefined(this.moduleSpecifierNode) || !(this.exportClauseNode instanceof TypeScriptNamedExportsNode))
    return;

  for (const specifierNode of this.exportClauseNode.children)
    if (!Object.isUndefined(specifierNode.asKeywordNode) && specifierNode.nameNode instanceof TypeScriptStringLiteralNode)
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1003, specifierNode.nameNode.span);
};

TypeScriptExportDeclarationNode.prototype.isTypeScriptDeclarationStatement = function (this: TypeScriptExportDeclarationNode): boolean {
  return true;
};
