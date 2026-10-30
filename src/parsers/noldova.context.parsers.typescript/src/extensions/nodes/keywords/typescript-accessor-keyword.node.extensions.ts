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
import { TypeScriptAccessorKeywordNode } from "../../../models/nodes/keywords/typescript-accessor-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

TypeScriptAccessorKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKeywordNode.prototype.startsTypeScriptClassMember = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptAccessorKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Readonly) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [context.source.getText(this.span), Resources.readonly]);
  else if ((writtenFlags & TypeScriptModifierFlags.Declare) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [context.source.getText(this.span), Resources.declare]);
  else if (target === TypeScriptModifierTarget.ModuleElement)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1275, this.span);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.Parameter)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1275, this.span);

  return TypeScriptModifierFlags.Accessor;
};

TypeScriptAccessorKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptAccessorKeywordNode, context: TypeScriptParserContext,
  declarationNode: Node): void {
  if ((declarationNode.getTypeScriptAllowedModifiers() & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1275, this.span);
};

TypeScriptAccessorKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};

TypeScriptAccessorKeywordNode.prototype.mustStartTypeScriptDeclarationBeforeName = function (this: TypeScriptAccessorKeywordNode): boolean {
  return true;
};
