/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptMissingIdentifierNode } from "../../../models/nodes/identifiers/typescript-missing-identifier.node.js";
import type { TypeScriptBreakKeywordNode } from "../../../models/nodes/keywords/typescript-break-keyword.node.js";
import type { TypeScriptContinueKeywordNode } from "../../../models/nodes/keywords/typescript-continue-keyword.node.js";
import { TypeScriptBreakStatementNode } from "../../../models/nodes/statements/typescript-break-statement.node.js";
import { TypeScriptContinueStatementNode } from "../../../models/nodes/statements/typescript-continue-statement.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { IdentifierNameParser } from "../names/identifier-name.parser.js";

export class JumpStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;
  private readonly nameParser: IdentifierNameParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.nameParser = new IdentifierNameParser(typescriptParser);
  }

  public parseBreak(breakKeywordNode: TypeScriptBreakKeywordNode): TypeScriptBreakStatementNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const labelNode = this.parseLabel();
    const semicolonNode = typescriptParser.parseStatementTerminator();
    const endNode: Node = semicolonNode ?? labelNode ?? breakKeywordNode;
    const resultNode = new TypeScriptBreakStatementNode(
      breakKeywordNode,
      typescriptParser.typescriptLexer.reader.createSpan(breakKeywordNode.span, endNode.span),
      labelNode,
      semicolonNode,
      breakKeywordNode.leadingTrivia,
      endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }

  public parseContinue(continueKeywordNode: TypeScriptContinueKeywordNode): TypeScriptContinueStatementNode {
    const typescriptParser = this.typescriptParser;
    typescriptParser.advance();
    const labelNode = this.parseLabel();
    const semicolonNode = typescriptParser.parseStatementTerminator();
    const endNode: Node = semicolonNode ?? labelNode ?? continueKeywordNode;
    const resultNode = new TypeScriptContinueStatementNode(
      continueKeywordNode,
      typescriptParser.typescriptLexer.reader.createSpan(continueKeywordNode.span, endNode.span),
      labelNode,
      semicolonNode,
      continueKeywordNode.leadingTrivia,
      endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(typescriptParser.context);
    return resultNode;
  }

  private parseLabel(): Node | undefined {
    const parser = this.typescriptParser;
    if (parser.canParseStatementTerminator())
      return undefined;
    return this.nameParser.parseIdentifier() ?? new TypeScriptMissingIdentifierNode(parser.currentNode.getTypeScriptMissingNodeSpan());
  }
}
