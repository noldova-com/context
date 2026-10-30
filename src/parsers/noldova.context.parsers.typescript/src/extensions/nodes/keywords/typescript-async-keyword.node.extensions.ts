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
import { TypeScriptConstructorDeclarationNode } from "../../../models/nodes/declarations/typescript-constructor-declaration.node.js";
import { TypeScriptAsyncKeywordNode } from "../../../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptFunctionKeywordNode } from "../../../models/nodes/keywords/typescript-function-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptAsyncKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptAsyncFunctionStart = function (this: TypeScriptAsyncKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode instanceof TypeScriptFunctionKeywordNode;
  });
};

TypeScriptAsyncKeywordNode.prototype.parseTypeScriptPrimaryExpression = function (this: TypeScriptAsyncKeywordNode, parser: TypeScriptSyntaxParser): Node {
  return this.isTypeScriptAsyncFunctionStart(parser) ? parser.parseFunctionExpression() : parser.consumeName();
};

TypeScriptAsyncKeywordNode.prototype.tryParseTypeScriptAssignmentStart = function (
  this: TypeScriptAsyncKeywordNode,
  parser: TypeScriptSyntaxParser): Node | undefined {
  return parser.tryParseParenthesizedExpressionOrArrowFunction() ?? parser.tryParseArrowFunction();
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptAsyncKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Declare) !== TypeScriptModifierFlags.None || context.isAmbient)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1040, this.span, [Resources.async]);
  else if ((writtenFlags & TypeScriptModifierFlags.Abstract) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [context.source.getText(this.span), Resources.abstract]);
  else if (target === TypeScriptModifierTarget.Parameter)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1090, this.span, [context.source.getText(this.span)]);

  return TypeScriptModifierFlags.Async;
};

TypeScriptAsyncKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptAsyncKeywordNode, context: TypeScriptParserContext,
  declarationNode: Node): void {
  if ((declarationNode.getTypeScriptAllowedModifiers() & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None)
    return;

  const template = declarationNode instanceof TypeScriptConstructorDeclarationNode
    ? TypeScriptDiagnosticTemplates.TS1089
    : TypeScriptDiagnosticTemplates.TS1042;
  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, this.span, [context.source.getText(this.span)]);
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptModifierReadAfterList = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.isTypeScriptAsyncIdentifier = function (this: TypeScriptAsyncKeywordNode): boolean {
  return true;
};

TypeScriptAsyncKeywordNode.prototype.canFollowTypeScriptDefaultKeyword = function (this: TypeScriptAsyncKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.isTypeScriptAsyncFunctionStart(parser);
};
