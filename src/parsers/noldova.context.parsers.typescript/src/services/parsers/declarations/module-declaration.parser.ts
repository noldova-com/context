/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, ValueNode } from "@noldova/context.parsers";

import { TypeScriptNameReservation } from "../../../enums/typescript-name-reservation.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptModuleDeclarationNode } from "../../../models/nodes/declarations/typescript-module-declaration.node.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import { TypeScriptQualifiedNameNode } from "../../../models/nodes/identifiers/typescript-qualified-name.node.js";
import { TypeScriptGlobalKeywordNode } from "../../../models/nodes/keywords/typescript-global-keyword.node.js";
import { TypeScriptModuleKeywordNode } from "../../../models/nodes/keywords/typescript-module-keyword.node.js";
import type { TypeScriptNamespaceKeywordNode } from "../../../models/nodes/keywords/typescript-namespace-keyword.node.js";
import { TypeScriptStringLiteralNode } from "../../../models/nodes/literals/typescript-string-literal.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { BlockParser } from "../statements/block.parser.js";

export class ModuleDeclarationParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;
  private readonly blockParser: BlockParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
    this.blockParser = new BlockParser(typescriptParser);
  }

  public isNamedStart(): boolean {
    const parser = this.typescriptParser;
    return parser.lookAhead(() => {
      parser.advance();
      return !parser.hasPrecedingLineBreak()
        && (parser.currentNode.isTypeScriptIdentifier(parser.context) || parser.currentNode instanceof TypeScriptStringLiteralNode);
    });
  }

  public parse(keywordNode: TypeScriptModuleKeywordNode | TypeScriptNamespaceKeywordNode | TypeScriptGlobalKeywordNode,
    modifierNodes: readonly Node[] = []): TypeScriptModuleDeclarationNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? keywordNode;
    const previousAwaitNameCount = parser.context.records.awaitNameCount;
    parser.advance();
    const isGlobal = keywordNode instanceof TypeScriptGlobalKeywordNode;
    const isQuotedModule = keywordNode instanceof TypeScriptModuleKeywordNode && parser.currentNode instanceof TypeScriptStringLiteralNode;
    const nameNode = isGlobal ? undefined : isQuotedModule ? parser.consumeName() : this.parseName();
    const isNamespace = !isGlobal && !isQuotedModule;
    const openBraceNode = parser.currentNode;
    const previousNamespaceBody = parser.context.isNamespaceBody;
    parser.context.isNamespaceBody = isNamespace;
    const bodyNode = openBraceNode instanceof TypeScriptOpenBraceNode
      ? this.blockParser.parseModuleBody(openBraceNode)
      : isNamespace ? this.blockParser.reportMissing() : undefined;
    parser.context.isNamespaceBody = previousNamespaceBody;
    const semicolonNode = Object.isUndefined(bodyNode) ? parser.parseStatementTerminator() : undefined;
    parser.context.records.awaitNameCount = previousAwaitNameCount;
    const endNode = bodyNode ?? semicolonNode ?? nameNode ?? keywordNode;
    const resultNode = new TypeScriptModuleDeclarationNode(keywordNode, parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span),
      nameNode, bodyNode, semicolonNode, modifierNodes, startNode.leadingTrivia, endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }

  public reportInvalidName(nameNode: ValueNode): void {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (node instanceof TypeScriptOpenBraceNode)
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1437, node.span);
    else
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS2819, node.span,
        [node.getTypeScriptTokenValue() ?? nameNode.value]);
  }

  private parseName(): Node {
    const parser = this.typescriptParser;
    const previousAwaitNameCount = parser.context.records.awaitNameCount;
    let nameNode = this.nameParser.parseIdentifier() ?? this.createMissingIdentifier();
    while (parser.currentNode instanceof TypeScriptDotNode) {
      const dotNode = parser.currentNode;
      parser.advance();
      const rightNode = this.nameParser.parseIdentifierName() ?? this.createMissingIdentifier();
      if (rightNode.getTypeScriptNameReservation() === TypeScriptNameReservation.Strict)
        parser.readName(rightNode);
      nameNode = new TypeScriptQualifiedNameNode(nameNode, dotNode, rightNode,
        parser.typescriptLexer.reader.createSpan(nameNode.span, rightNode.span), nameNode.leadingTrivia, rightNode.trailingTrivia);
    }
    parser.context.records.awaitNameCount = previousAwaitNameCount;
    return nameNode;
  }

  private createMissingIdentifier(): TypeScriptMissingIdentifierNode {
    return new TypeScriptMissingIdentifierNode(this.typescriptParser.currentNode.getTypeScriptMissingNodeSpan());
  }
}
