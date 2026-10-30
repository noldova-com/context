/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptModifierFlags } from "../../../enums/typescript-modifier-flags.js";
import { TypeScriptModifierTarget } from "../../../enums/typescript-modifier-target.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptInKeywordNode } from "../../../models/nodes/keywords/typescript-in-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptInKeywordNode.prototype.getTypeScriptPrecedence = function (this: TypeScriptInKeywordNode): TypeScriptOperatorPrecedence {
  return TypeScriptOperatorPrecedence.Relational;
};

TypeScriptInKeywordNode.prototype.getTypeScriptAssociativity = function (this: TypeScriptInKeywordNode): TypeScriptAssociativity {
  return TypeScriptAssociativity.Left;
};

TypeScriptInKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptInKeywordNode): boolean {
  return true;
};

TypeScriptInKeywordNode.prototype.parseTypeScriptBinaryExpression = function (
  this: TypeScriptInKeywordNode,
  parser: TypeScriptSyntaxParser,
  leftNode: Node,
  minimumPrecedence: number): Node | undefined {
  return parser.context.isDisallowInContext ? undefined : parser.parseBinaryOperator(this, leftNode, minimumPrecedence);
};

TypeScriptInKeywordNode.prototype.canStartTypeScriptExpression = function (this: TypeScriptInKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return !parser.context.isDisallowInContext;
};

TypeScriptInKeywordNode.prototype.isTypeScriptUnexpectedStatementToken = function (this: TypeScriptInKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return !this.canStartTypeScriptExpression(parser);
};

TypeScriptInKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptInKeywordNode): boolean {
  return true;
};

TypeScriptInKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptInKeywordNode): boolean {
  return true;
};

TypeScriptInKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptInKeywordNode): boolean {
  return true;
};

TypeScriptInKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptInKeywordNode): boolean {
  return true;
};

TypeScriptInKeywordNode.prototype.canStartTypeScriptTypeParameter = function (this: TypeScriptInKeywordNode): boolean {
  return true;
};

TypeScriptInKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptInKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget): TypeScriptModifierFlags {
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source,
    target === TypeScriptModifierTarget.TypeMember ? TypeScriptDiagnosticTemplates.TS1070 : TypeScriptDiagnosticTemplates.TS1274,
    this.span, [context.source.getText(this.span)]);

  return TypeScriptModifierFlags.None;
};

TypeScriptInKeywordNode.prototype.validateTypeScriptTypeParameterModifier = function (this: TypeScriptInKeywordNode,
  context: TypeScriptParserContext, accepted: TypeScriptTypeParameterAnnotations,
  writtenAnnotations: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterAnnotations {
  if ((accepted & TypeScriptTypeParameterAnnotations.In) === TypeScriptTypeParameterAnnotations.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1274, this.span, [context.source.getText(this.span)]);
  else if ((writtenAnnotations & TypeScriptTypeParameterAnnotations.In) !== TypeScriptTypeParameterAnnotations.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if ((writtenAnnotations & TypeScriptTypeParameterAnnotations.Out) !== TypeScriptTypeParameterAnnotations.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.out]);

  return TypeScriptTypeParameterAnnotations.In;
};
