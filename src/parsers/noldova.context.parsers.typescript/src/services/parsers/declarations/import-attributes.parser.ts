/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptImportAttributeNode } from "../../../models/nodes/declarations/typescript-import-attribute.node.js";
import { TypeScriptImportAttributesNode } from "../../../models/nodes/declarations/typescript-import-attributes.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import { TypeScriptAssertKeywordNode } from "../../../models/nodes/keywords/typescript-assert-keyword.node.js";
import { TypeScriptWithKeywordNode } from "../../../models/nodes/keywords/typescript-with-keyword.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";

export class ImportAttributesParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
  }

  public parse(): TypeScriptImportAttributesNode | undefined {
    const parser = this.typescriptParser;
    const keywordNode = parser.currentNode;
    if (!(keywordNode instanceof TypeScriptWithKeywordNode) && !(keywordNode instanceof TypeScriptAssertKeywordNode && !parser.hasPrecedingLineBreak()))
      return undefined;
    this.consumeKeyword(keywordNode);
    return this.parseList(keywordNode, keywordNode);
  }

  public parseTypeAttributes(): TypeScriptImportAttributesNode {
    const parser = this.typescriptParser;
    const keywordNode = parser.currentNode;
    const hasKeyword = keywordNode instanceof TypeScriptWithKeywordNode || keywordNode instanceof TypeScriptAssertKeywordNode;
    if (hasKeyword)
      this.consumeKeyword(keywordNode);
    else
      parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1005, keywordNode.span, [Resources.with]);
    const colonNode = parser.tryConsume(TypeScriptColonNode);
    if (Object.isUndefined(colonNode))
      parser.reportExpected(Resources.colon);
    const attributesNode = this.parseList(hasKeyword ? keywordNode : undefined, hasKeyword ? keywordNode : colonNode, colonNode);
    for (const attributeNode of attributesNode.children)
      parser.context.records.uncheckedSpans.push(attributeNode.valueNode.span);
    return attributesNode;
  }

  private consumeKeyword(keywordNode: TypeScriptWithKeywordNode | TypeScriptAssertKeywordNode): void {
    if (keywordNode instanceof TypeScriptAssertKeywordNode)
      this.typescriptParser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS2880, keywordNode.span);
    this.typescriptParser.advance();
  }

  private parseList(keywordNode: TypeScriptWithKeywordNode | TypeScriptAssertKeywordNode | undefined, startNode: Node | undefined,
    colonNode?: TypeScriptColonNode): TypeScriptImportAttributesNode {
    const parser = this.typescriptParser;
    parser.context.enterList(TypeScriptListKind.ImportAttributes);
    try {
      const openBraceNode = parser.tryConsume(TypeScriptOpenBraceNode);
      const attributeNodes: TypeScriptImportAttributeNode[] = [];
      const commaNodes: TypeScriptCommaNode[] = [];
      let endNode: Node | undefined = openBraceNode ?? startNode;
      if (Object.isUndefined(openBraceNode))
        parser.reportExpected(Resources.openBrace);
      else
        while (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode)) {
          if (!parser.currentNode.isTypeScriptListElement(TypeScriptListKind.ImportAttributes, parser)) {
            parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1478, parser.currentNode.span);
            if (parser.context.isListBoundary(parser))
              break;
            endNode = parser.currentNode;
            parser.advance();
            continue;
          }
          const attributeNode = this.parseAttribute();
          attributeNodes.push(attributeNode);
          endNode = attributeNode;
          const commaNode = parser.tryConsume(TypeScriptCommaNode);
          if (!Object.isUndefined(commaNode)) {
            commaNodes.push(commaNode);
            endNode = commaNode;
          }
          else if (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode)) {
            parser.reportExpected(Resources.comma);
            if (parser.currentNode instanceof TypeScriptSemicolonNode && !parser.hasPrecedingLineBreak()) {
              endNode = parser.currentNode;
              parser.advance();
            }
          }
        }
      const closeBraceNode = Object.isUndefined(openBraceNode) ? undefined : parser.tryConsume(TypeScriptCloseBraceNode);
      if (!Object.isUndefined(openBraceNode) && Object.isUndefined(closeBraceNode)) {
        parser.reportExpected(Resources.closeBrace);
        parser.context.diagnosticCollector.relateTypeScriptOpeningDelimiter(parser.context.source, openBraceNode.span, Resources.openBrace,
          Resources.closeBrace);
      }
      endNode = closeBraceNode ?? endNode;
      const firstNode = startNode ?? openBraceNode;
      const span = Object.isUndefined(endNode)
        ? parser.currentNode.getTypeScriptMissingNodeSpan()
        : parser.typescriptLexer.reader.createSpan(firstNode!.span, endNode.span);
      return new TypeScriptImportAttributesNode(keywordNode, attributeNodes, commaNodes, span, openBraceNode, closeBraceNode, colonNode,
        firstNode?.leadingTrivia, endNode?.trailingTrivia);
    }
    finally {
      this.typescriptParser.context.leaveList();
    }
  }

  private parseAttribute(): TypeScriptImportAttributeNode {
    const parser = this.typescriptParser;
    const startNode = parser.currentNode;
    const nameNode = this.nameParser.parseIdentifierOrStringName()!;
    const colonNode = parser.tryConsume(TypeScriptColonNode);
    if (Object.isUndefined(colonNode))
      parser.reportExpected(Resources.colon);
    const valueNode = this.parseValue();
    return new TypeScriptImportAttributeNode(parser.typescriptLexer.reader.createSpan(startNode.span, valueNode.span),
      nameNode, valueNode, colonNode, startNode.leadingTrivia, valueNode.trailingTrivia);
  }

  private parseValue(): Node {
    const parser = this.typescriptParser;
    const node = parser.currentNode;
    if (parser.isEndOfFile || node.isTypeScriptClosingDelimiter() || node instanceof TypeScriptCommaNode || node instanceof TypeScriptSemicolonNode)
      return node.reportTypeScriptMissingExpression(parser);
    return parser.parseAssignmentExpression();
  }
}
