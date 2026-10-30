/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptOutKeywordNode } from "../../../models/nodes/keywords/typescript-out-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";

TypeScriptOutKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptOutKeywordNode): boolean {
  return true;
};

TypeScriptOutKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptOutKeywordNode): boolean {
  return true;
};

TypeScriptOutKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptOutKeywordNode): boolean {
  return true;
};

TypeScriptOutKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptOutKeywordNode): boolean {
  return true;
};

TypeScriptOutKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptOutKeywordNode): boolean {
  return true;
};

TypeScriptOutKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptOutKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget): TypeScriptModifierFlags {
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
    target === TypeScriptModifierTarget.TypeMember ? TypeScriptDiagnosticTemplates.TS1070 : TypeScriptDiagnosticTemplates.TS1274,
    this.span, [context.source.getText(this.span)]);

  return TypeScriptModifierFlags.None;
};

TypeScriptOutKeywordNode.prototype.validateTypeScriptTypeParameterModifier = function (this: TypeScriptOutKeywordNode,
  context: TypeScriptParserContext, accepted: TypeScriptTypeParameterAnnotations,
  writtenAnnotations: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterAnnotations {
  if ((accepted & TypeScriptTypeParameterAnnotations.Out) === TypeScriptTypeParameterAnnotations.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1274, this.span, [context.source.getText(this.span)]);
  else if ((writtenAnnotations & TypeScriptTypeParameterAnnotations.Out) !== TypeScriptTypeParameterAnnotations.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);

  return TypeScriptTypeParameterAnnotations.Out;
};
