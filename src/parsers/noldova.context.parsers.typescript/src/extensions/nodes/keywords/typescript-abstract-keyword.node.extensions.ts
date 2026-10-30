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
import { TypeScriptClassDeclarationNode } from "../../../models/nodes/declarations/typescript-class-declaration.node.js";
import { TypeScriptAbstractKeywordNode } from "../../../models/nodes/keywords/typescript-abstract-keyword.node.js";
import { TypeScriptAsyncKeywordNode } from "../../../models/nodes/keywords/typescript-async-keyword.node.js";
import { TypeScriptClassKeywordNode } from "../../../models/nodes/keywords/typescript-class-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptAbstractKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptAbstractKeywordNode): boolean {
  return true;
};

TypeScriptAbstractKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptAbstractKeywordNode): boolean {
  return true;
};

TypeScriptAbstractKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptAbstractKeywordNode): boolean {
  return true;
};

TypeScriptAbstractKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptAbstractKeywordNode): boolean {
  return true;
};

TypeScriptAbstractKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptAbstractKeywordNode): boolean {
  return true;
};

TypeScriptAbstractKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptAbstractKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags, declarationNode: Node): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Abstract) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.Parameter)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1242, this.span);
  else if (declarationNode instanceof TypeScriptClassDeclarationNode)
    return TypeScriptModifierFlags.Abstract;
  else if ((writtenFlags & TypeScriptModifierFlags.Private) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [Resources.private, context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Static) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, this.span, [Resources.static, context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Override) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.override]);
  else if ((writtenFlags & TypeScriptModifierFlags.Accessor) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.accessor]);
  else if ((writtenFlags & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None) {
    const asyncNode = declarationNode.getTypeScriptModifierNodes().find(t => t instanceof TypeScriptAsyncKeywordNode);
    if (!Object.isUndefined(asyncNode))
      context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1243, asyncNode.span,
        [Resources.async, context.source.getText(this.span)]);
  }

  return TypeScriptModifierFlags.Abstract;
};

TypeScriptAbstractKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptAbstractKeywordNode, context: TypeScriptParserContext,
  declarationNode: Node): void {
  if ((declarationNode.getTypeScriptAllowedModifiers() & TypeScriptModifierFlags.Abstract) === TypeScriptModifierFlags.None) {
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1242, this.span);
    return;
  }
  if (context.isAbstractClassBody)
    return;

  const template = declarationNode.getTypeScriptAbstractRejection();
  if (!Object.isUndefined(template))
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, template, this.span);
};

TypeScriptAbstractKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptAbstractKeywordNode): boolean {
  return true;
};

TypeScriptAbstractKeywordNode.prototype.canFollowTypeScriptDefaultKeyword = function (this: TypeScriptAbstractKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return !parser.hasPrecedingLineBreak() && parser.currentNode instanceof TypeScriptClassKeywordNode;
  });
};
