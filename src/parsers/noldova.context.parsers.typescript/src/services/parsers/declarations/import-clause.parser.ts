/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptImportClauseNode } from "../../../models/nodes/declarations/typescript-import-clause.node.js";
import { TypeScriptNamespaceImportNode } from "../../../models/nodes/declarations/typescript-namespace-import.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptAsKeywordNode } from "../../../models/nodes/keywords/typescript-as-keyword.node.js";
import { TypeScriptAsteriskNode } from "../../../models/nodes/operators/typescript-asterisk.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { NamedBindingsParser } from "./named-bindings.parser.js";

export class ImportClauseParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly namedBindingsParser: NamedBindingsParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.namedBindingsParser = new NamedBindingsParser(typescriptParser);
  }

  public parse(defaultNameNode?: Node): TypeScriptImportClauseNode {
    const parser = this.typescriptParser;
    const startNode = defaultNameNode ?? parser.currentNode;
    const commaNode = Object.isUndefined(defaultNameNode) ? undefined : parser.tryConsume(TypeScriptCommaNode);
    const namedBindingsNode = Object.isUndefined(defaultNameNode) || !Object.isUndefined(commaNode)
      ? parser.currentNode instanceof TypeScriptAsteriskNode ? this.parseNamespace() : this.namedBindingsParser.parseImports()
      : undefined;
    const endNode = namedBindingsNode ?? defaultNameNode!;
    const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
    return new TypeScriptImportClauseNode(span, defaultNameNode, commaNode, namedBindingsNode, startNode.leadingTrivia, endNode.trailingTrivia);
  }

  private parseNamespace(): TypeScriptNamespaceImportNode {
    const parser = this.typescriptParser;
    const asteriskNode = parser.requireCurrentNode(TypeScriptAsteriskNode);
    parser.advance();
    const asKeywordNode = parser.tryConsume(TypeScriptAsKeywordNode);
    if (Object.isUndefined(asKeywordNode))
      parser.reportExpected(Resources.as);
    const nameNode = this.nameParser.parseIdentifier() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
    return new TypeScriptNamespaceImportNode(asteriskNode, parser.typescriptLexer.reader.createSpan(asteriskNode.span, nameNode.span),
      nameNode, asKeywordNode, asteriskNode.leadingTrivia, nameNode.trailingTrivia);
  }
}
