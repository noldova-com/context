/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiagnosticTemplate } from "@noldova/context.diagnostics";

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptAccessibilityKeywordNode } from "../../../models/nodes/keywords/typescript-accessibility-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

declare module "../../../models/nodes/keywords/typescript-accessibility-keyword.node.js" {
  interface TypeScriptAccessibilityKeywordNode {
    getTypeScriptAbstractConflict(): DiagnosticTemplate;
    getTypeScriptAccessibilityFlags(): TypeScriptModifierFlags;
  }
}

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.startsTypeScriptClassMember = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptAccessibilityKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Accessibility) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1028, this.span);
  else if (target === TypeScriptModifierTarget.ModuleElement)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1044, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Override) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.override]);
  else if ((writtenFlags & TypeScriptModifierFlags.Static) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.static]);
  else if ((writtenFlags & TypeScriptModifierFlags.Readonly) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.readonly]);
  else if ((writtenFlags & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.accessor]);
  else if ((writtenFlags & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.async]);
  else if ((writtenFlags & TypeScriptModifierFlags.Abstract) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, this.getTypeScriptAbstractConflict(), this.span, [context.source.getText(this.span), Resources.abstract]);

  return this.getTypeScriptAccessibilityFlags();
};

TypeScriptAccessibilityKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptAccessibilityKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Strict;
};

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.isTypeScriptParameterPropertyModifier = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.mustStartTypeScriptDeclarationBeforeName = function (this: TypeScriptAccessibilityKeywordNode): boolean {
  return true;
};

TypeScriptAccessibilityKeywordNode.prototype.getTypeScriptAbstractConflict = function (this: TypeScriptAccessibilityKeywordNode): DiagnosticTemplate {
  return TypeScriptDiagnosticTemplates.TS1029;
};

TypeScriptAccessibilityKeywordNode.prototype.getTypeScriptAccessibilityFlags = function (this: TypeScriptAccessibilityKeywordNode): TypeScriptModifierFlags {
  return TypeScriptModifierFlags.Accessibility;
};
