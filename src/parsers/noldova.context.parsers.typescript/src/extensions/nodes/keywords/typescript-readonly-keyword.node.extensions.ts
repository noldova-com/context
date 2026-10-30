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
import { TypeScriptReadonlyKeywordNode } from "../../../models/nodes/keywords/typescript-readonly-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.startsTypeScriptClassMember = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptTypeOperator = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptReadonlyKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Readonly) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.ModuleElement)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1024, this.span);
  else if ((writtenFlags & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [context.source.getText(this.span), Resources.accessor]);

  return TypeScriptModifierFlags.Readonly;
};

TypeScriptReadonlyKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptReadonlyKeywordNode, context: TypeScriptParserContext,
  declarationNode: Node): void {
  if ((declarationNode.getTypeScriptAllowedModifiers() & TypeScriptModifierFlags.Readonly) !== TypeScriptModifierFlags.None)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1024, this.span);
};

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.isTypeScriptParameterPropertyModifier = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};

TypeScriptReadonlyKeywordNode.prototype.mustStartTypeScriptDeclarationBeforeName = function (this: TypeScriptReadonlyKeywordNode): boolean {
  return true;
};
