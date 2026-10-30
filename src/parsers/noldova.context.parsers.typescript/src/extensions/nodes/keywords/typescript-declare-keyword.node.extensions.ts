/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDeclareKeywordNode } from "../../../models/nodes/keywords/typescript-declare-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptDeclareKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptDeclareKeywordNode): boolean {
  return true;
};

TypeScriptDeclareKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptDeclareKeywordNode): boolean {
  return true;
};

TypeScriptDeclareKeywordNode.prototype.reportTypeScriptMissingSemicolon = function (this: TypeScriptDeclareKeywordNode, _parser: TypeScriptSyntaxParser): void {
};

TypeScriptDeclareKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptDeclareKeywordNode): boolean {
  return true;
};

TypeScriptDeclareKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptDeclareKeywordNode): boolean {
  return true;
};

TypeScriptDeclareKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptDeclareKeywordNode): boolean {
  return true;
};

TypeScriptDeclareKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptDeclareKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Declare) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1040, this.span, [Resources.async]);
  else if ((writtenFlags & TypeScriptModifierFlags.Override) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1040, this.span, [Resources.override]);
  else if ((writtenFlags & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [context.source.getText(this.span), Resources.accessor]);
  else if (target === TypeScriptModifierTarget.Parameter)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1090, this.span, [context.source.getText(this.span)]);
  else if (context.isAmbient && context.isModuleBody)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1038, this.span);

  return TypeScriptModifierFlags.Declare;
};

TypeScriptDeclareKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptDeclareKeywordNode, context: TypeScriptParserContext,
  declarationNode: Node): void {
  if ((declarationNode.getTypeScriptAllowedModifiers() & TypeScriptModifierFlags.Declare) !== TypeScriptModifierFlags.None)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1031, this.span, [context.source.getText(this.span)]);
};

TypeScriptDeclareKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptDeclareKeywordNode): boolean {
  return true;
};

TypeScriptDeclareKeywordNode.prototype.isTypeScriptDeclarationFileModifier = function (this: TypeScriptDeclareKeywordNode): boolean {
  return true;
};
