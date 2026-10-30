/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptListKind } from "../../../enums/typescript-list-kind.js";
import { TypeScriptCaseClauseNode } from "../../../models/nodes/clauses/typescript-case-clause.node.js";
import { TypeScriptDefaultClauseNode } from "../../../models/nodes/clauses/typescript-default-clause.node.js";
import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import type { TypeScriptCaseKeywordNode } from "../../../models/nodes/keywords/typescript-case-keyword.node.js";
import type { TypeScriptDefaultKeywordNode } from "../../../models/nodes/keywords/typescript-default-keyword.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class SwitchClauseParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parseCase(caseKeywordNode: TypeScriptCaseKeywordNode): TypeScriptCaseClauseNode {
    const parser = this.typescriptParser;
    parser.advance();
    const node = parser.currentNode;
    const expressionNode = node instanceof TypeScriptColonNode ? node.reportTypeScriptMissingExpression(parser) : parser.parseExpressionAllowingIn();
    const colonNode = this.parseColon();
    const statements: Node[] = [];
    const endNode = this.parseStatements(statements) ?? colonNode ?? expressionNode;
    return new TypeScriptCaseClauseNode(caseKeywordNode, expressionNode, statements,
      parser.typescriptLexer.reader.createSpan(caseKeywordNode.span, endNode.span), colonNode, caseKeywordNode.leadingTrivia, endNode.trailingTrivia);
  }

  public parseDefault(defaultKeywordNode: TypeScriptDefaultKeywordNode): TypeScriptDefaultClauseNode {
    const parser = this.typescriptParser;
    parser.advance();
    const colonNode = this.parseColon();
    const statements: Node[] = [];
    const endNode = this.parseStatements(statements) ?? colonNode ?? defaultKeywordNode;
    return new TypeScriptDefaultClauseNode(defaultKeywordNode, statements,
      parser.typescriptLexer.reader.createSpan(defaultKeywordNode.span, endNode.span), colonNode, defaultKeywordNode.leadingTrivia, endNode.trailingTrivia);
  }

  private parseColon(): TypeScriptColonNode | undefined {
    const parser = this.typescriptParser;
    const colonNode = parser.tryConsume(TypeScriptColonNode);
    if (Object.isUndefined(colonNode))
      parser.reportExpected(Resources.colon);
    return colonNode;
  }

  private parseStatements(statements: Node[]): Node | undefined {
    const parser = this.typescriptParser;
    parser.context.enterList(TypeScriptListKind.SwitchClauseStatements);
    try {
      let endNode: Node | undefined;
      while (!parser.isEndOfFile && !parser.currentNode.isTypeScriptSwitchClauseStart() && !(parser.currentNode instanceof TypeScriptCloseBraceNode))
        if (parser.currentNode.isTypeScriptUnexpectedStatementToken(parser)) {
          parser.currentNode.reportTypeScriptUnexpectedStatementToken(parser, TypeScriptListKind.SwitchClauseStatements);
          if (parser.context.isListBoundary(parser))
            break;
          endNode = parser.currentNode;
          parser.advance();
        }
        else {
          endNode = parser.parseStatement();
          statements.push(endNode);
        }
      return endNode;
    }
    finally {
      parser.context.leaveList();
    }
  }
}
