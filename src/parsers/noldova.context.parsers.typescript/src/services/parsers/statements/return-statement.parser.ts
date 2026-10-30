/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptReturnKeywordNode } from "../../../models/nodes/keywords/typescript-return-keyword.node.js";
import { TypeScriptReturnStatementNode } from "../../../models/nodes/statements/typescript-return-statement.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ReturnStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(returnKeywordNode: TypeScriptReturnKeywordNode): TypeScriptReturnStatementNode {
    this.typescriptParser.advance();
    const expressionNode = this.typescriptParser.canParseStatementTerminator() ? undefined : this.typescriptParser.parseExpressionAllowingIn();
    const semicolonNode = this.typescriptParser.parseStatementTerminator();
    const endNode: Node = semicolonNode ?? expressionNode ?? returnKeywordNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(returnKeywordNode.span, endNode.span);
    const resultNode = new TypeScriptReturnStatementNode(
      returnKeywordNode,
      span,
      expressionNode,
      semicolonNode,
      returnKeywordNode.leadingTrivia,
      endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(this.typescriptParser.context);
    return resultNode;
  }
}
