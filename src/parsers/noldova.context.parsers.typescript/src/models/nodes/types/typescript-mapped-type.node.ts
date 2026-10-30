/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";
import { CompositeNode } from "@noldova/context.parsers";

import type { TypeScriptCloseBraceNode } from "../delimiters/typescript-close-brace.node.js";
import type { TypeScriptCloseBracketNode } from "../delimiters/typescript-close-bracket.node.js";
import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptOpenBraceNode } from "../delimiters/typescript-open-brace.node.js";
import type { TypeScriptOpenBracketNode } from "../delimiters/typescript-open-bracket.node.js";
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptAsKeywordNode } from "../keywords/typescript-as-keyword.node.js";
import type { TypeScriptReadonlyKeywordNode } from "../keywords/typescript-readonly-keyword.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";
import type { TypeScriptTypeParameterNode } from "./typescript-type-parameter.node.js";

export class TypeScriptMappedTypeNode extends CompositeNode {
  public readonly asKeywordNode: TypeScriptAsKeywordNode | undefined;
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly nameTypeNode: Node | undefined;
  public readonly openBraceNode: TypeScriptOpenBraceNode;
  public readonly openBracketNode: TypeScriptOpenBracketNode | undefined;
  public readonly optionalOperatorNode: Node | undefined;
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly readonlyKeywordNode: TypeScriptReadonlyKeywordNode | undefined;
  public readonly readonlyOperatorNode: Node | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly typeNode: Node | undefined;
  public readonly typeParameterNode: TypeScriptTypeParameterNode;

  public constructor(
    openBraceNode: TypeScriptOpenBraceNode,
    memberNodes: readonly Node[],
    span: SourceSpan,
    typeParameterNode: TypeScriptTypeParameterNode,
    readonlyOperatorNode?: Node,
    readonlyKeywordNode?: TypeScriptReadonlyKeywordNode,
    openBracketNode?: TypeScriptOpenBracketNode,
    asKeywordNode?: TypeScriptAsKeywordNode,
    nameTypeNode?: Node,
    closeBracketNode?: TypeScriptCloseBracketNode,
    optionalOperatorNode?: Node,
    questionNode?: TypeScriptQuestionNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(memberNodes, span, leadingTrivia, trailingTrivia);
    this.openBraceNode = openBraceNode;
    this.readonlyOperatorNode = readonlyOperatorNode;
    this.readonlyKeywordNode = readonlyKeywordNode;
    this.openBracketNode = openBracketNode;
    this.typeParameterNode = typeParameterNode;
    this.asKeywordNode = asKeywordNode;
    this.nameTypeNode = nameTypeNode;
    this.closeBracketNode = closeBracketNode;
    this.optionalOperatorNode = optionalOperatorNode;
    this.questionNode = questionNode;
    this.colonNode = colonNode;
    this.typeNode = typeNode;
    this.semicolonNode = semicolonNode;
    this.closeBraceNode = closeBraceNode;
  }
}
