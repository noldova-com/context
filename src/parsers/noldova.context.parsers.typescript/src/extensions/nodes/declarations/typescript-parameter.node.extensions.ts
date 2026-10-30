/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptBindingPatternNode } from "../../../models/nodes/declarations/typescript-binding-pattern.node.js";
import { TypeScriptParameterNode } from "../../../models/nodes/declarations/typescript-parameter.node.js";
import { TypeScriptThisKeywordNode } from "../../../models/nodes/keywords/typescript-this-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptParameterNode.prototype.toTypeScriptParameter = function (this: TypeScriptParameterNode): TypeScriptParameterNode {
  return this;
};

declare module "../../../models/nodes/declarations/typescript-parameter.node.js" {
  interface TypeScriptParameterNode {
    isTypeScriptThisParameter(): boolean;
    isTypeScriptParameterProperty(): boolean;
    recordTypeScriptMisplacedParameterProperty(context: TypeScriptParserContext): void;
    validateTypeScriptSignatureParameter(context: TypeScriptParserContext): void;
  }
}

TypeScriptParameterNode.prototype.isTypeScriptThisParameter = function (this: TypeScriptParameterNode): boolean {
  return this.nameNode instanceof TypeScriptThisKeywordNode;
};

TypeScriptParameterNode.prototype.isTypeScriptOptionalParameter = function (this: TypeScriptParameterNode): boolean {
  return !Object.isUndefined(this.questionNode);
};

TypeScriptParameterNode.prototype.validateTypeScriptGrammar = function (this: TypeScriptParameterNode, context: TypeScriptParserContext): void {
  if (!Object.isUndefined(this.dotDotDotNode)) {
    if (!Object.isUndefined(this.questionNode))
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1047, this.questionNode.span);
    else if (!Object.isUndefined(this.equalsNode))
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1048, this.nameNode.span);
  }
  else if (!Object.isUndefined(this.questionNode) && !Object.isUndefined(this.equalsNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1015, this.nameNode.span);
};

TypeScriptParameterNode.prototype.readTypeScriptEvalOrArgumentsNames = function (this: TypeScriptParameterNode, parser: TypeScriptSyntaxParser): void {
  this.nameNode.readTypeScriptEvalOrArgumentsNames(parser);
};

TypeScriptParameterNode.prototype.isTypeScriptParameterProperty = function (this: TypeScriptParameterNode): boolean {
  return this.modifierNodes.some(t => t.isTypeScriptParameterPropertyModifier());
};

TypeScriptParameterNode.prototype.reportTypeScriptGrammarAfterModifiers = function (this: TypeScriptParameterNode,
  context: TypeScriptParserContext, hasModifierDiagnostics: boolean): void {
  if (hasModifierDiagnostics || !this.isTypeScriptParameterProperty())
    return;

  if (this.nameNode instanceof TypeScriptBindingPatternNode)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1187, this.span);
  else if (!Object.isUndefined(this.dotDotDotNode))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1317, this.span);
};

TypeScriptParameterNode.prototype.recordTypeScriptMisplacedParameterProperty = function (this: TypeScriptParameterNode, context: TypeScriptParserContext): void {
  if (this.isTypeScriptParameterProperty())
    context.records.misplacedParameterProperties.push(this);
};

TypeScriptParameterNode.prototype.validateTypeScriptSignatureParameter = function (this: TypeScriptParameterNode, context: TypeScriptParserContext): void {
  const isTypeRead = Object.isUndefined(this.typeNode) && this.nameNode.readsTypeScriptDeclaredType(true);
  if (!Object.isUndefined(this.initializerNode)) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS2371, this.span);
    const uncheckedSpan = isTypeRead ? this.initializerNode.getTypeScriptQuickTypeSkippedSpan() : this.initializerNode.span;
    if (!Object.isUndefined(uncheckedSpan))
      context.records.uncheckedSpans.push(uncheckedSpan);
  }
  this.nameNode.reportTypeScriptInitializersWithoutImplementation(context,
    isTypeRead && (Object.isUndefined(this.initializerNode) || this.initializerNode.readsTypeScriptContextualType()));
};
