/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptExportDeclarationNode } from "../../../models/nodes/declarations/typescript-export-declaration.node.js";
import { TypeScriptNamespaceExportNode } from "../../../models/nodes/declarations/typescript-namespace-export.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptAsKeywordNode } from "../../../models/nodes/keywords/typescript-as-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../../../models/nodes/keywords/typescript-export-keyword.node.js";
import { TypeScriptFromKeywordNode } from "../../../models/nodes/keywords/typescript-from-keyword.node.js";
import { TypeScriptTypeKeywordNode } from "../../../models/nodes/keywords/typescript-type-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { ImportAttributesParser } from "./import-attributes.parser.js";
import { ModuleSpecifierParser } from "./module-specifier.parser.js";
import { NamedBindingsParser } from "./named-bindings.parser.js";

export class ExportDeclarationParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly namedBindingsParser: NamedBindingsParser;
  private readonly attributesParser: ImportAttributesParser;
  private readonly moduleSpecifierParser: ModuleSpecifierParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.namedBindingsParser = new NamedBindingsParser(typescriptParser);
    this.attributesParser = new ImportAttributesParser(typescriptParser);
    this.moduleSpecifierParser = new ModuleSpecifierParser(typescriptParser);
  }

  public parse(exportKeywordNode: TypeScriptExportKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptExportDeclarationNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? exportKeywordNode;
    const previousFlags = parser.context.contextFlags;
    const previousAwaitNameCount = parser.context.records.awaitNameCount;
    parser.context.contextFlags |= TypeScriptContextFlags.Await;
    try {
      const typeKeywordNode = parser.tryConsume(TypeScriptTypeKeywordNode);
      const asteriskNode = parser.currentNode;
      const exportClauseNode = asteriskNode instanceof TypeScriptAsteriskNode ? this.parseNamespace(asteriskNode) : this.namedBindingsParser.parseExports();
      const needsModule = asteriskNode instanceof TypeScriptAsteriskNode || parser.currentNode instanceof TypeScriptFromKeywordNode
        || (parser.currentNode instanceof TypeScriptStringLiteralNode && !parser.hasPrecedingLineBreak());
      const fromKeywordNode = needsModule ? parser.tryConsume(TypeScriptFromKeywordNode) : undefined;
      if (needsModule && Object.isUndefined(fromKeywordNode))
        parser.reportExpected(Resources.from);
      const moduleSpecifierNode = needsModule ? this.moduleSpecifierParser.parse() : undefined;
      const attributesNode = !Object.isUndefined(moduleSpecifierNode) && !parser.hasPrecedingLineBreak() ? this.attributesParser.parse() : undefined;
      const semicolonNode = parser.parseStatementTerminator();
      const endNode = semicolonNode ?? attributesNode ?? moduleSpecifierNode ?? fromKeywordNode ?? exportClauseNode;
      const resultNode = new TypeScriptExportDeclarationNode(
        exportKeywordNode,
        parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span),
        exportClauseNode,
        typeKeywordNode,
        fromKeywordNode,
        moduleSpecifierNode,
        attributesNode,
        semicolonNode,
        modifierNodes,
        startNode.leadingTrivia,
        endNode.trailingTrivia);

      resultNode.validateTypeScriptGrammar(parser.context);
      return resultNode;
    }
    finally {
      parser.context.contextFlags = previousFlags;
      parser.context.records.awaitNameCount = previousAwaitNameCount;
    }
  }

  private parseNamespace(asteriskNode: TypeScriptAsteriskNode): TypeScriptNamespaceExportNode {
    const parser = this.typescriptParser;
    parser.advance();
    const asKeywordNode = parser.tryConsume(TypeScriptAsKeywordNode);
    const nameNode = Object.isUndefined(asKeywordNode) ? undefined : this.parseNamespaceName();
    const endNode = nameNode ?? asteriskNode;
    return new TypeScriptNamespaceExportNode(asteriskNode, parser.typescriptLexer.reader.createSpan(asteriskNode.span, endNode.span),
      asKeywordNode, nameNode, asteriskNode.leadingTrivia, endNode.trailingTrivia);
  }

  private parseNamespaceName(): Node {
    const parser = this.typescriptParser;
    const nameNode = this.nameParser.parseIdentifierOrStringName() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
    parser.readName(nameNode);
    return nameNode;
  }
}
