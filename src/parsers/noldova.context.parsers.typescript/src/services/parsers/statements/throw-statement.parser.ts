/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptMissingExpressionNode } from "../../../models/nodes/expressions/typescript-missing-expression.node.js";
import type { TypeScriptThrowKeywordNode } from "../../../models/nodes/keywords/typescript-throw-keyword.node.js";
import { TypeScriptThrowStatementNode } from "../../../models/nodes/statements/typescript-throw-statement.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ThrowStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(throwKeywordNode: TypeScriptThrowKeywordNode): TypeScriptThrowStatementNode {
    this.typescriptParser.advance();
    const expressionNode = this.typescriptParser.hasPrecedingLineBreak()
      ? new TypeScriptMissingExpressionNode(this.typescriptParser.currentNode.getTypeScriptMissingNodeSpan())
      : this.typescriptParser.parseExpressionAllowingIn();

    const semicolonNode = this.typescriptParser.parseStatementTerminator(expressionNode);
    const endNode: Node = semicolonNode ?? expressionNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(throwKeywordNode.span, endNode.span);
    const resultNode = new TypeScriptThrowStatementNode(
      throwKeywordNode,
      span,
      expressionNode,
      semicolonNode,
      throwKeywordNode.leadingTrivia,
      endNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(this.typescriptParser.context);
    return resultNode;
  }
}
