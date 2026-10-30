/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptSemicolonNode } from "../../../models/nodes/delimiters/typescript-semicolon.node.js";
import type { TypeScriptDoKeywordNode } from "../../../models/nodes/keywords/typescript-do-keyword.node.js";
import { TypeScriptWhileKeywordNode } from "../../../models/nodes/keywords/typescript-while-keyword.node.js";
import { TypeScriptDoStatementNode } from "../../../models/nodes/statements/typescript-do-statement.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class DoStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(doKeywordNode: TypeScriptDoKeywordNode): TypeScriptDoStatementNode {
    this.typescriptParser.advance();
    const statementNode = this.typescriptParser.parseIterationBody();
    const whileKeywordNode = this.typescriptParser.tryConsume(TypeScriptWhileKeywordNode);
    if (Object.isUndefined(whileKeywordNode))
      this.typescriptParser.reportExpected(Resources.while);

    const openParenthesisNode = this.typescriptParser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      this.typescriptParser.reportExpected(Resources.openParenthesis);

    const conditionNode = this.typescriptParser.parseExpressionAllowingIn();
    const closeParenthesisNode = this.typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      this.typescriptParser.context.diagnosticCollector.addTypeScriptMissingClosingDelimiterDiagnostic(this.typescriptParser.context.source,
        this.typescriptParser.currentNode.span, openParenthesisNode?.span, Resources.openParenthesis, Resources.closeParenthesis);

    const semicolonNode = this.typescriptParser.tryConsume(TypeScriptSemicolonNode);
    const endNode: Node = semicolonNode ?? closeParenthesisNode ?? conditionNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(doKeywordNode.span, endNode.span);
    return new TypeScriptDoStatementNode(
      doKeywordNode,
      statementNode,
      span,
      conditionNode,
      whileKeywordNode,
      openParenthesisNode,
      closeParenthesisNode,
      semicolonNode,
      doKeywordNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
