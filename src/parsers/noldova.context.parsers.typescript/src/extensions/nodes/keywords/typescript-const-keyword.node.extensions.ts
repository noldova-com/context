/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptEnumDeclarationNode } from "../../../models/nodes/declarations/typescript-enum-declaration.node.js";
import { TypeScriptConstKeywordNode } from "../../../models/nodes/keywords/typescript-const-keyword.node.js";
import { TypeScriptEnumKeywordNode } from "../../../models/nodes/keywords/typescript-enum-keyword.node.js";
import type { TypeScriptParserContext } from "../../../models/typescript-parser-context.js";
import type { TypeScriptSyntaxParser } from "../../../services/typescript-syntax.parser.js";

TypeScriptConstKeywordNode.prototype.isTypeScriptTypeParameterModifier = function (this: TypeScriptConstKeywordNode): boolean {
  return true;
};

TypeScriptConstKeywordNode.prototype.isTypeScriptVariableDeclarationKeyword = function (this: TypeScriptConstKeywordNode): this is TypeScriptConstKeywordNode {
  return true;
};

TypeScriptConstKeywordNode.prototype.parseTypeScriptStatement = function (this: TypeScriptConstKeywordNode, parser: TypeScriptSyntaxParser, modifierNodes: readonly Node[] = []): Node {
  return this.canParseTypeScriptDeclarationModifier(parser) ? parser.parseDeclaration() : parser.parseVariableStatement(this, modifierNodes);
};

TypeScriptConstKeywordNode.prototype.isTypeScriptDeclarationStart = function (this: TypeScriptConstKeywordNode, _parser: TypeScriptSyntaxParser): boolean {
  return true;
};

TypeScriptConstKeywordNode.prototype.isTypeScriptDeclarationModifier = function (this: TypeScriptConstKeywordNode): boolean {
  return true;
};

TypeScriptConstKeywordNode.prototype.hasTypeScriptModifierFollower = function (this: TypeScriptConstKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return parser.lookAhead(() => {
    parser.advance();
    return parser.currentNode instanceof TypeScriptEnumKeywordNode;
  });
};

TypeScriptConstKeywordNode.prototype.canParseTypeScriptClassMemberModifier = function (this: TypeScriptConstKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.hasTypeScriptSameLineModifierFollower(parser);
};

TypeScriptConstKeywordNode.prototype.canParseTypeScriptTypeParameterModifier = function (this: TypeScriptConstKeywordNode, parser: TypeScriptSyntaxParser): boolean {
  return this.hasTypeScriptSameLineModifierFollower(parser);
};

TypeScriptConstKeywordNode.prototype.isTypeScriptParameterModifier = function (this: TypeScriptConstKeywordNode): boolean {
  return true;
};

TypeScriptConstKeywordNode.prototype.isTypeScriptTypeMemberModifier = function (this: TypeScriptConstKeywordNode): boolean {
  return true;
};

TypeScriptConstKeywordNode.prototype.canStartTypeScriptTypeParameter = function (this: TypeScriptConstKeywordNode): boolean {
  return true;
};

TypeScriptConstKeywordNode.prototype.validateTypeScriptModifierForDeclaration = function (this: TypeScriptConstKeywordNode,
  context: TypeScriptParserContext, declarationNode: Node): void {
  if (declarationNode instanceof TypeScriptEnumDeclarationNode)
    return;

  context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1248,
    declarationNode.getTypeScriptDeclarationNameSpan(context), [context.source.getText(this.span)]);
};

TypeScriptConstKeywordNode.prototype.validateTypeScriptTypeParameterModifier = function (this: TypeScriptConstKeywordNode,
  context: TypeScriptParserContext, accepted: TypeScriptTypeParameterAnnotations): TypeScriptTypeParameterAnnotations {
  if ((accepted & TypeScriptTypeParameterAnnotations.Const) === TypeScriptTypeParameterAnnotations.None)
    context.diagnosticCollector.addTypeScriptGrammarDiagnostic(context.source, TypeScriptDiagnosticTemplates.TS1277, this.span, [context.source.getText(this.span)]);

  return TypeScriptTypeParameterAnnotations.None;
};
