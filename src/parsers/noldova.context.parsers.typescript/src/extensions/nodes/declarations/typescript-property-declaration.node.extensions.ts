/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";
import type { Node } from "@noldova/context.parsers";
import type { SourceSpan } from "@noldova/context.parsers";

import { TypeScriptDecoratorSupport } from "../../../enums/typescript-decorator-support.js";
import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptPropertyDeclarationNode } from "../../../models/nodes/declarations/typescript-property-declaration.node.js";
import { TypeScriptAbstractKeywordNode } from "../../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptDeclareKeywordNode } from "../../../models/nodes/keywords/typescript-declare-keyword.node.js";
import { TypeScriptReadonlyKeywordNode } from "../../../models/nodes/keywords/typescript-readonly-keyword.node.js";
import { TypeScriptStaticKeywordNode } from "../../../models/nodes/keywords/typescript-static-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptPropertyDeclarationNode.prototype.getTypeScriptAllowedModifiers = function (this: TypeScriptPropertyDeclarationNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.All & ~(TypeScriptModifierFlags.Async);
};

TypeScriptPropertyDeclarationNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptPropertyDeclarationNode,
  context: TypeScriptParserContext): void {
  if (Object.isUndefined(this.exclamationNode))
    return;

  const template = !Object.isUndefined(this.initializerNode)
    ? TypeScriptDiagnosticTemplates.TS1263
    : Object.isUndefined(this.typeNode)
      ? TypeScriptDiagnosticTemplates.TS1264
      : context.isAmbient || this.modifierNodes.some(t => t instanceof TypeScriptStaticKeywordNode || t instanceof TypeScriptAbstractKeywordNode
        || t instanceof TypeScriptDeclareKeywordNode)
        ? TypeScriptDiagnosticTemplates.TS1255
        : undefined;
  if (!Object.isUndefined(template))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, this.exclamationNode.span);
};

TypeScriptPropertyDeclarationNode.prototype.getTypeScriptDecoratorSupport = function (this: TypeScriptPropertyDeclarationNode): TypeScriptDecoratorSupport {
  return this.modifierNodes.some(t => t instanceof TypeScriptAbstractKeywordNode || t instanceof TypeScriptDeclareKeywordNode)
    ? TypeScriptDecoratorSupport.Unsupported
    : TypeScriptDecoratorSupport.Supported;
};

TypeScriptPropertyDeclarationNode.prototype.getTypeScriptAbstractRejection = function (this: TypeScriptPropertyDeclarationNode): DiagnosticTemplate | undefined {
  return TypeScriptDiagnosticTemplates.TS1253;
};

TypeScriptPropertyDeclarationNode.prototype.getTypeScriptDeclarationNameSpan = function (this: TypeScriptPropertyDeclarationNode,
  _context: TypeScriptParserContext): SourceSpan {
  return this.nameNode.span;
};

TypeScriptPropertyDeclarationNode.prototype.reportTypeScriptGrammarAfterModifiers = function (this: TypeScriptPropertyDeclarationNode,
  context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void {
  if (Object.isUndefined(this.initializerNode))
    return;

  if (this.modifierNodes.some(t => t instanceof TypeScriptAbstractKeywordNode)) {
    const nameSpan = this.getTypeScriptDeclarationNameSpan(context);
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1267, nameSpan,
      [context.source.getText(nameSpan)]);
  }

  if (hasModifierDiagnostics || !(context.isAmbient || this.modifierNodes.some(t => t instanceof TypeScriptDeclareKeywordNode))
    || (this.modifierNodes.some(t => t instanceof TypeScriptReadonlyKeywordNode) && Object.isUndefined(this.typeNode)))
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1039,
    this.initializerNode.span);
};

TypeScriptPropertyDeclarationNode.prototype.getTypeScriptModifierNodes = function (this: TypeScriptPropertyDeclarationNode): readonly Node[] {
  return this.modifierNodes;
};
