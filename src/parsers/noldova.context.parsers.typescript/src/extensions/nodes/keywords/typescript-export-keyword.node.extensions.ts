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
import { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptExportKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptExportKeywordNode): boolean {
  return true;
};

TypeScriptExportKeywordNode.prototype.hasTypeScriptModifierFollower = function (this: TypeScriptExportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.canFollowTypeScriptExportKeyword(parser);
  });
};

TypeScriptExportKeywordNode.prototype.isTypeScriptDeclarationKeyword = function (this: TypeScriptExportKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptExportKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptExportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode.isTypeScriptExportFormStart(parser);
  });
};

TypeScriptExportKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptExportKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  if (modifierNodes.length === 0 && (this.canParseTypeScriptDeclarationModifier(parser) || !this.isTypeScriptDeclarationStart(parser)))
    return parser.isDeclarationStart() ? parser.parseDeclaration() : parser.parseExpressionOrLabeledStatement();
  parser.advance();
  return parser.currentNode.parseTypeScriptExport(parser, this, modifierNodes);
};

TypeScriptExportKeywordNode.prototype.canStartTypeScriptStatement = function (this: TypeScriptExportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.isDeclarationStart();
};

TypeScriptExportKeywordNode.prototype.isTypeScriptMisplacedModifier = function (this: TypeScriptExportKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return !parser.isDeclarationStart();
};

TypeScriptExportKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptExportKeywordNode): boolean {
  return true;
};

TypeScriptExportKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptExportKeywordNode): boolean {
  return true;
};

TypeScriptExportKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptExportKeywordNode): boolean {
  return true;
};

TypeScriptExportKeywordNode.prototype.isTypeScriptClassMemberModifier = function (this: TypeScriptExportKeywordNode): boolean {
  return true;
};

TypeScriptExportKeywordNode.prototype.validateTypeScriptModifier = function (this: TypeScriptExportKeywordNode, context: TypeScriptParserContext,
  target: TypeScriptModifierTarget, writtenFlags: TypeScriptModifierFlags): TypeScriptModifierFlags {
  if ((writtenFlags & TypeScriptModifierFlags.Export) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1030, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.ClassElement)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1031, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.TypeMember)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1070, this.span, [context.source.getText(this.span)]);
  else if (target === TypeScriptModifierTarget.Parameter)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1090, this.span, [context.source.getText(this.span)]);
  else if ((writtenFlags & TypeScriptModifierFlags.Declare) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.declare]);
  else if ((writtenFlags & TypeScriptModifierFlags.Abstract) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.abstract]);
  else if ((writtenFlags & TypeScriptModifierFlags.Async) !== TypeScriptModifierFlags.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1029, this.span, [context.source.getText(this.span), Resources.async]);

  return TypeScriptModifierFlags.Export;
};

TypeScriptExportKeywordNode.prototype.isTypeScriptDeclarationStartModifier = function (this: TypeScriptExportKeywordNode): boolean {
  return true;
};

TypeScriptExportKeywordNode.prototype.isTypeScriptDeclarationFileModifier = function (this: TypeScriptExportKeywordNode): boolean {
  return true;
};
