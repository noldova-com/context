/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import type { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptAsKeywordNode } from "../../../models/nodes/keywords/typescript-as-keyword.node.js";
import { TypeScriptInKeywordNode } from "../../../models/nodes/keywords/typescript-in-keyword.node.js";
import { TypeScriptReadonlyKeywordNode } from "../../../models/nodes/keywords/typescript-readonly-keyword.node.js";
import { TypeScriptMinusNode } from "../../../models/nodes/operators/typescript-minus.node.js";
import { TypeScriptPlusNode } from "../../../models/nodes/operators/typescript-plus.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { TypeScriptMappedTypeNode } from "../../../models/nodes/types/typescript-mapped-type.node.js";
import { TypeScriptTypeLiteralNode } from "../../../models/nodes/types/typescript-type-literal.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { TypeMemberParser } from "./type-member.parser.js";
import type { TypeParameterListParser } from "./type-parameter-list.parser.js";

export class TypeLiteralParser {
  private readonly typeMemberParser: TypeMemberParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    typeMemberParser: TypeMemberParser,
    typeParameterListParser: TypeParameterListParser) {
    this.typescriptParser = typescriptParser;
    this.typeMemberParser = typeMemberParser;
    this.typeParameterListParser = typeParameterListParser;
  }

  public parse(openBraceNode: TypeScriptOpenBraceNode): TypeScriptMappedTypeNode | TypeScriptTypeLiteralNode {
    if (this.isMappedType())
      return this.parseMappedType(openBraceNode);

    return this.parseTypeLiteral(openBraceNode);
  }

  private parseTypeLiteral(openBraceNode: TypeScriptOpenBraceNode): TypeScriptTypeLiteralNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const memberNodes: Node[] = [];
    let endNode: Node = this.typeMemberParser.parseList(memberNodes) ?? openBraceNode;

    const closeBraceNode = typescriptParser.tryConsume(TypeScriptCloseBraceNode);
    if (Object.isUndefined(closeBraceNode))
      typescriptParser.reportExpected(Resources.closeBrace);
    else
      endNode = closeBraceNode;

    const span = typescriptParser.typescriptLexer.reader.createSpan(openBraceNode.span, endNode.span);
    return new TypeScriptTypeLiteralNode(
      openBraceNode,
      memberNodes,
      span,
      closeBraceNode,
      openBraceNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  private parseMappedType(openBraceNode: TypeScriptOpenBraceNode): TypeScriptMappedTypeNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const readonlyOperatorNode = typescriptParser.tryConsume(TypeScriptPlusNode) ?? typescriptParser.tryConsume(TypeScriptMinusNode);
    const readonlyKeywordNode = typescriptParser.tryConsume(TypeScriptReadonlyKeywordNode);
    const openBracketNode = typescriptParser.tryConsume(TypeScriptOpenBracketNode);
    const typeParameterNode = this.typeParameterListParser.parseMappedTypeParameter();
    const asKeywordNode = typescriptParser.tryConsume(TypeScriptAsKeywordNode);
    const nameTypeNode = Object.isUndefined(asKeywordNode) ? undefined : this.typescriptParser.parseType();
    const closeBracketNode = typescriptParser.tryConsume(TypeScriptCloseBracketNode);
    if (Object.isUndefined(closeBracketNode))
      typescriptParser.reportExpected(Resources.closeBracket);

    const optionalOperatorNode = typescriptParser.tryConsume(TypeScriptPlusNode)
      ?? typescriptParser.tryConsume(TypeScriptMinusNode);
    const questionNode = typescriptParser.tryConsume(TypeScriptQuestionNode);
    if (!Object.isUndefined(optionalOperatorNode) && Object.isUndefined(questionNode))
      typescriptParser.reportExpected(Resources.question);

    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    const typeNode = Object.isUndefined(colonNode) ? undefined : this.typescriptParser.parseType();
    const semicolonNode = typescriptParser.parseStatementTerminator();
    const memberNodes: Node[] = [];
    const listEndNode = this.typeMemberParser.parseList(memberNodes);
    if (memberNodes.length > 0)
      typescriptParser.context.records.uncheckedSpans.push(typescriptParser.typescriptLexer.reader.createSpan(memberNodes[0]!.span, memberNodes.at(-1)!.span));

    const closeBraceNode = typescriptParser.tryConsume(TypeScriptCloseBraceNode);
    if (Object.isUndefined(closeBraceNode))
      typescriptParser.reportExpected(Resources.closeBrace);

    const endNode = closeBraceNode
      ?? listEndNode
      ?? semicolonNode
      ?? typeNode
      ?? colonNode
      ?? questionNode
      ?? optionalOperatorNode
      ?? closeBracketNode
      ?? nameTypeNode
      ?? asKeywordNode
      ?? typeParameterNode;
    const span = typescriptParser.typescriptLexer.reader.createSpan(
      openBraceNode.span,
      endNode.span);

    return new TypeScriptMappedTypeNode(
      openBraceNode,
      memberNodes,
      span,
      typeParameterNode,
      readonlyOperatorNode,
      readonlyKeywordNode,
      openBracketNode,
      asKeywordNode,
      nameTypeNode,
      closeBracketNode,
      optionalOperatorNode,
      questionNode,
      colonNode,
      typeNode,
      semicolonNode,
      closeBraceNode,
      openBraceNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  private isMappedType(): boolean {
    const typescriptParser = this.typescriptParser;
    return typescriptParser.lookAhead(() => {
      typescriptParser.advance();
      if (typescriptParser.currentNode instanceof TypeScriptPlusNode
        || typescriptParser.currentNode instanceof TypeScriptMinusNode) {
        typescriptParser.advance();
        if (!(typescriptParser.currentNode instanceof TypeScriptReadonlyKeywordNode))
          return false;
      }

      if (typescriptParser.currentNode instanceof TypeScriptReadonlyKeywordNode)
        typescriptParser.advance();

      if (!(typescriptParser.currentNode instanceof TypeScriptOpenBracketNode))
        return false;

      typescriptParser.advance();
      if (!typescriptParser.currentNode.isTypeScriptBindingIdentifier())
        return false;

      typescriptParser.advance();
      return typescriptParser.currentNode instanceof TypeScriptInKeywordNode;
    });
  }
}
