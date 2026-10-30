/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNamespaceExportDeclarationNode } from "../../../models/nodes/declarations/typescript-namespace-export-declaration.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import type { TypeScriptAsKeywordNode } from "../../../models/nodes/keywords/typescript-as-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptNamespaceKeywordNode } from "../../../models/nodes/keywords/typescript-namespace-keyword.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";

export class NamespaceExportDeclarationParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
  }

  public parse(exportKeywordNode: TypeScriptExportKeywordNode, asKeywordNode: TypeScriptAsKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptNamespaceExportDeclarationNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? exportKeywordNode;
    parser.advance();
    const namespaceKeywordNode = parser.tryConsume(TypeScriptNamespaceKeywordNode);
    if (Object.isUndefined(namespaceKeywordNode))
      parser.reportExpected(Resources.namespace);
    const previousAwaitNameCount = parser.context.records.awaitNameCount;
    const nameNode = this.nameParser.parseIdentifier() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
    parser.context.records.awaitNameCount = previousAwaitNameCount;
    const semicolonNode = parser.parseStatementTerminator();
    const endNode = semicolonNode ?? nameNode;
    const resultNode = new TypeScriptNamespaceExportDeclarationNode(exportKeywordNode,
      parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span), asKeywordNode, nameNode,
      namespaceKeywordNode, semicolonNode, modifierNodes, startNode.leadingTrivia, endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }
}
