/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBindingElementNode } from "../../../models/nodes/declarations/typescript-binding-element.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptBindingElementNode.prototype.reportTypeScriptLetNames = function (this: TypeScriptBindingElementNode, context: TypeScriptParserContext): void {
  this.nameNode.reportTypeScriptLetNames(context);
};

TypeScriptBindingElementNode.prototype.reportTypeScriptInitializersWithoutImplementation = function (this: TypeScriptBindingElementNode,
  context: TypeScriptParserContext, isTypeRead: boolean): void {
  const uncheckedSpan = isTypeRead ? this.initializerNode?.getTypeScriptQuickTypeSkippedSpan() : this.initializerNode?.span;
  if (!Object.isUndefined(uncheckedSpan))
    context.records.uncheckedSpans.push(uncheckedSpan);
  if (!this.readsTypeScriptDeclaredType(true))
    return;

  if (!Object.isUndefined(this.initializerNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2371, this.nameNode.span);
  this.nameNode.reportTypeScriptInitializersWithoutImplementation(context, isTypeRead);
};

TypeScriptBindingElementNode.prototype.readsTypeScriptDeclaredType = function (this: TypeScriptBindingElementNode, isSignatureParameter: boolean): boolean {
  return !(isSignatureParameter && !Object.isUndefined(this.propertyNameNode) && this.nameNode.isTypeScriptBindingIdentifier());
};

TypeScriptBindingElementNode.prototype.hasTypeScriptBindingName = function (this: TypeScriptBindingElementNode, name: string): boolean {
  return this.nameNode.hasTypeScriptBindingName(name);
};

TypeScriptBindingElementNode.prototype.reportTypeScriptRestInitializer = function (this: TypeScriptBindingElementNode, context: TypeScriptParserContext): void {
  if (!Object.isUndefined(this.dotDotDotNode) && Object.isUndefined(this.propertyNameNode) && !Object.isUndefined(this.initializerNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1186, this.equalsNode!.span);
};

TypeScriptBindingElementNode.prototype.isTypeScriptRestElement = function (this: TypeScriptBindingElementNode): boolean {
  return !Object.isUndefined(this.dotDotDotNode);
};
