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
import { TypeScriptOverrideKeywordNode } from "../../../models/nodes/keywords/typescript-override-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

TypeScriptOverrideKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};

TypeScriptOverrideKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};

TypeScriptOverrideKeywordNode.prototype.startsTypeScriptClassMember = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};

TypeScriptOverrideKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};

TypeScriptOverrideKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};

TypeScriptOverrideKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptOverrideKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Override) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Declare) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [context.source.getText(this.span), Resources.declare]);
  else if ((writtenFlags & TypeScriptModifierFlags.Readonly) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.readonly]);
  else if ((writtenFlags & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.accessor]);
  else if ((writtenFlags & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.async]);

  return TypeScriptModifierFlags.Override;
};

TypeScriptOverrideKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptOverrideKeywordNode,
  context: TypeScriptParserContext, declarationNode: Node): void {
  if ((declarationNode.getTypeScriptAllowedModifiers() & TypeScriptModifierFlags.Override) !== TypeScriptModifierFlags.None)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1089, this.span, [context.source.getText(this.span)]);
};

TypeScriptOverrideKeywordNode.prototype.isTypeScriptModifierReadAfterList = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};

TypeScriptOverrideKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};

TypeScriptOverrideKeywordNode.prototype.isTypeScriptParameterPropertyModifier = function (this: TypeScriptOverrideKeywordNode): boolean {
  return true;
};
