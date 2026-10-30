/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptEnumDeclarationNode } from "../../../models/nodes/declarations/typescript-enum-declaration.node.js";
import type { TypeScriptEnumMemberNode } from "../../../models/nodes/declarations/typescript-enum-member.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptOpenBraceNode } from "../../../models/nodes/delimiters/typescript-open-brace.node.js";
import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import type { TypeScriptEnumKeywordNode } from "../../../models/nodes/keywords/typescript-enum-keyword.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";
import { EnumMemberParser } from "./enum-member.parser.js";

export class EnumDeclarationParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly enumMemberParser: EnumMemberParser;
  private readonly nameParser: IdentifierNameParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.enumMemberParser = new EnumMemberParser(typescriptParser);
    this.nameParser = new IdentifierNameParser(typescriptParser);
  }

  public parse(enumKeywordNode: TypeScriptEnumKeywordNode, modifierNodes: readonly Node[] = []): TypeScriptEnumDeclarationNode {
    const parser = this.typescriptParser;
    const startNode = modifierNodes[0] ?? enumKeywordNode;
    const previousAwaitNameCount = parser.context.records.awaitNameCount;
    parser.advance();
    const nameNode = this.nameParser.parseIdentifier() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());

    const openBraceNode = parser.tryConsume(TypeScriptOpenBraceNode);
    const memberNodes: TypeScriptEnumMemberNode[] = [];
    const commaNodes: TypeScriptCommaNode[] = [];
    const previousFlags = parser.context.contextFlags;
    parser.context.contextFlags = TypeScriptContextFlags.None;
    try {
      const listEndNode = Object.isUndefined(openBraceNode) ? undefined : this.parseMembers(memberNodes, commaNodes);

      const closeBraceNode = Object.isUndefined(openBraceNode) ? undefined : parser.tryConsume(TypeScriptCloseBraceNode);
      if (Object.isUndefined(openBraceNode) || Object.isUndefined(closeBraceNode))
        parser.reportExpected(Object.isUndefined(openBraceNode) ? Resources.openBrace : Resources.closeBrace);

      const endNode = closeBraceNode ?? listEndNode ?? openBraceNode ?? nameNode;
      const span = parser.typescriptLexer.reader.createSpan(startNode.span, endNode.span);
      const enumNode = new TypeScriptEnumDeclarationNode(
        enumKeywordNode,
        memberNodes,
        commaNodes,
        span,
        nameNode,
        openBraceNode,
        closeBraceNode,
        modifierNodes,
        startNode.leadingTrivia,
        endNode.trailingTrivia);
      enumNode.validateTypeScriptGrammar(parser.context);
      return enumNode;
    }
    finally {
      parser.context.contextFlags = previousFlags;
      parser.context.records.awaitNameCount = previousAwaitNameCount;
    }
  }

  private parseMembers(memberNodes: TypeScriptEnumMemberNode[], commaNodes: TypeScriptCommaNode[]): Node | undefined {
    this.typescriptParser.context.enterList(TypeScriptListKind.EnumMembers);
    try {
      const parser = this.typescriptParser;
      let endNode: Node | undefined;
      while (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode)) {
        if (!parser.currentNode.isTypeScriptListElement(TypeScriptListKind.EnumMembers, parser)) {
          parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1132, parser.currentNode.span);
          if (parser.context.isListBoundary(parser))
            break;
          endNode = parser.currentNode;
          parser.advance();
          continue;
        }

        const memberNode = this.enumMemberParser.parse();
        memberNodes.push(memberNode);
        endNode = memberNode;

        const commaNode = parser.tryConsume(TypeScriptCommaNode);
        if (!Object.isUndefined(commaNode)) {
          commaNodes.push(commaNode);
          endNode = commaNode;
        }
        else if (!parser.isEndOfFile && !(parser.currentNode instanceof TypeScriptCloseBraceNode))
          parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1357, parser.currentNode.span);
      }
      return endNode;
    }
    finally {
      this.typescriptParser.context.leaveList();
    }
  }
}
