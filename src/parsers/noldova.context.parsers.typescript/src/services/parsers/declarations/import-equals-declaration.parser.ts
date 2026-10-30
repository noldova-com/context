/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptExternalModuleReferenceNode } from "../../../models/nodes/declarations/typescript-external-module-reference.node.js";
import { TypeScriptImportEqualsDeclarationNode } from "../../../models/nodes/declarations/typescript-import-equals-declaration.node.js";
import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import type { TypeScriptImportKeywordNode } from "../../../models/nodes/keywords/typescript-import-keyword.node.js";
import { TypeScriptRequireKeywordNode } from "../../../models/nodes/keywords/typescript-require-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../../../models/nodes/keywords/typescript-type-keyword.node.js";
import { TypeScriptEqualsNode } from "../../../models/nodes/operators/typescript-equals.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { EntityNameParser } from "../names/entity-name.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { ModuleSpecifierParser } from "./module-specifier.parser.js";

export class ImportEqualsDeclarationParser {
  private readonly entityNameParser: EntityNameParser;
  private readonly moduleSpecifierParser: ModuleSpecifierParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.entityNameParser = new EntityNameParser(typescriptParser);
    this.moduleSpecifierParser = new ModuleSpecifierParser(typescriptParser);
  }

  public parse(importKeywordNode: TypeScriptImportKeywordNode, nameNode: Node, typeKeywordNode?: TypeScriptTypeKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptImportEqualsDeclarationNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? importKeywordNode;
    const equalsNode = parser.tryConsume(TypeScriptEqualsNode);
    if (Object.isUndefined(equalsNode))
      parser.reportExpected(Resources.equals);
    const moduleReferenceNode = this.parseReference();
    const semicolonNode = parser.parseStatementTerminator();
    const endNode = semicolonNode ?? moduleReferenceNode;
    const resultNode = new TypeScriptImportEqualsDeclarationNode(importKeywordNode, nameNode,
      parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span), moduleReferenceNode, equalsNode, typeKeywordNode,
      semicolonNode, modifierNodes, startNode.leadingTrivia, endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }

  private parseReference(): Node {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    if (startNode instanceof TypeScriptRequireKeywordNode && parser.lookAhead(() => {
      parser.advance();
      return parser.currentNode instanceof TypeScriptOpenParenthesisNode;
    }))
      return this.parseExternalReference(startNode);
    const headNode = this.nameParser.parseIdentifier() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
    return this.entityNameParser.parseRest(headNode);
  }

  private parseExternalReference(requireKeywordNode: TypeScriptRequireKeywordNode): TypeScriptExternalModuleReferenceNode {
    const parser = this.typescriptParser;
    parser.advance();
    const openParenthesisNode = parser.requireCurrentNode(TypeScriptOpenParenthesisNode);
    parser.advance();
    const moduleSpecifierNode = this.moduleSpecifierParser.parse();
    const closeParenthesisNode = parser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      parser.reportExpected(Resources.closeParenthesis);
    const endNode = closeParenthesisNode ?? moduleSpecifierNode;
    return new TypeScriptExternalModuleReferenceNode(requireKeywordNode,
      parser.typescriptLexer.reader.createSpan(requireKeywordNode.span, endNode.span),
      openParenthesisNode, moduleSpecifierNode, closeParenthesisNode, requireKeywordNode.leadingTrivia, endNode.trailingTrivia);
  }
}
