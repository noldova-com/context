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
import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptStaticKeywordNode } from "../../../models/nodes/keywords/typescript-static-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptStaticKeywordNode.prototype.isTypeScriptBindingIdentifier = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.startsTypeScriptClassMember = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.hasTypeScriptModifierFollower = function (this: TypeScriptStaticKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.canFollowTypeScriptModifier();
  });
};

TypeScriptStaticKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptStaticKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if (target === TypeScriptModifierTarget.ModuleElement)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1044, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.Parameter)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1090, this.span, [context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Abstract) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [context.source.getText(this.span), Resources.abstract]);
  else if ((writtenFlags & TypeScriptModifierFlags.Override) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.override]);
  else if ((writtenFlags & TypeScriptModifierFlags.Readonly) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.readonly]);
  else if ((writtenFlags & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.accessor]);
  else if ((writtenFlags & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.async]);

  return TypeScriptModifierFlags.Static;
};

TypeScriptStaticKeywordNode.prototype.getTypeScriptNameReservation = function (this: TypeScriptStaticKeywordNode): TypeScriptNameReservation {
  return TypeScriptNameReservation.Strict;
};

TypeScriptStaticKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptStaticKeywordNode,
  context: TypeScriptParserContext, declarationNode: Node): void {
  if ((declarationNode.getTypeScriptAllowedModifiers() & TypeScriptModifierFlags.Static) !== TypeScriptModifierFlags.None)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1089, this.span, [context.source.getText(this.span)]);
};

TypeScriptStaticKeywordNode.prototype.isTypeScriptModifierReadAfterList = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.mustStartTypeScriptDeclarationBeforeName = function (this: TypeScriptStaticKeywordNode): boolean {
  return true;
};

TypeScriptStaticKeywordNode.prototype.startsTypeScriptClassStaticBlock = function (this: TypeScriptStaticKeywordNode,
  parser: TypeScriptSyntaxParser): this is TypeScriptStaticKeywordNode {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptOpenBraceNode;
  });
};
