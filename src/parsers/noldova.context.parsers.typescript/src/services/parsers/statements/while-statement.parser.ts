/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptWhileKeywordNode } from "../../../models/nodes/keywords/typescript-while-keyword.node.js";
import { TypeScriptWhileStatementNode } from "../../../models/nodes/statements/typescript-while-statement.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class WhileStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(whileKeywordNode: TypeScriptWhileKeywordNode): TypeScriptWhileStatementNode {
    this.typescriptParser.advance();
    const openParenthesisNode = this.typescriptParser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      this.typescriptParser.reportExpected(Resources.openParenthesis);

    const conditionNode = this.typescriptParser.parseExpressionAllowingIn();

    const closeParenthesisNode = this.typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      this.typescriptParser.context.diagnosticCollector.addTypeScriptMissingClosingDelimiterDiagnostic(this.typescriptParser.context.source,
        this.typescriptParser.currentNode.span, openParenthesisNode?.span, Resources.openParenthesis, Resources.closeParenthesis);

    const statementNode = this.typescriptParser.parseIterationBody();
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(whileKeywordNode.span, statementNode.span);
    return new TypeScriptWhileStatementNode(
      whileKeywordNode,
      statementNode,
      span,
      conditionNode,
      openParenthesisNode,
      closeParenthesisNode,
      whileKeywordNode.leadingTrivia,
      statementNode.trailingTrivia);
  }
}
