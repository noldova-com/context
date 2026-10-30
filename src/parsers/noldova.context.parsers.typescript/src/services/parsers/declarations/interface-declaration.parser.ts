/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptTypeParameterAnnotations } from "../../../enums/typescript-type-parameter-annotations.js";
import { TypeScriptInterfaceDeclarationNode } from "../../../models/nodes/declarations/typescript-interface-declaration.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import type { TypeScriptInterfaceKeywordNode } from "../../../models/nodes/keywords/typescript-interface-keyword.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { TypeMemberParser } from "../types/type-member.parser.js";
import { TypeParameterListParser } from "../types/type-parameter-list.parser.js";
import { HeritageClauseParser } from "./heritage-clause.parser.js";
import { ParameterListParser } from "./parameter-list.parser.js";

export class InterfaceDeclarationParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly typeParameterListParser: TypeParameterListParser;
  private readonly heritageClauseParser: HeritageClauseParser;
  private readonly typeMemberParser: TypeMemberParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.typeParameterListParser = new TypeParameterListParser(typescriptParser);
    this.heritageClauseParser = new HeritageClauseParser(typescriptParser);
    this.typeMemberParser = new TypeMemberParser(typescriptParser, new ParameterListParser(typescriptParser), this.typeParameterListParser);
  }

  public parse(interfaceKeywordNode: TypeScriptInterfaceKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptInterfaceDeclarationNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? interfaceKeywordNode;
    parser.advance();
    const nameNode = this.nameParser.parseIdentifier() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());

    const typeParameterListNode = this.typeParameterListParser.parseAllowingEmptyList(TypeScriptTypeParameterAnnotations.Variance);
    const heritageClauseNodes = this.heritageClauseParser.parseList();

    const openBraceNode = parser.tryConsume(TypeScriptOpenBraceNode);
    const memberNodes: Node[] = [];
    const listEndNode = Object.isUndefined(openBraceNode) ? undefined : this.typeMemberParser.parseList(memberNodes, true);
    const closeBraceNode = Object.isUndefined(openBraceNode) ? undefined : parser.tryConsume(TypeScriptCloseBraceNode);
    if (Object.isUndefined(openBraceNode) || Object.isUndefined(closeBraceNode))
      parser.reportExpected(Object.isUndefined(openBraceNode) ? Resources.openBrace : Resources.closeBrace);

    const endNode = closeBraceNode ?? listEndNode ?? openBraceNode ?? heritageClauseNodes.at(-1) ?? typeParameterListNode ?? nameNode;
    const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    const resultNode = new TypeScriptInterfaceDeclarationNode(
      interfaceKeywordNode, memberNodes, heritageClauseNodes, span, nameNode, typeParameterListNode, openBraceNode, closeBraceNode, modifierNodes,
      startNode.leadingTrivia, endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }
}
