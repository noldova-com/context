/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCloseParenthesisNode } from "../../../models/nodes/delimiters/typescript-close-parenthesis.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptWithKeywordNode } from "../../../models/nodes/keywords/typescript-with-keyword.node.js";
import { TypeScriptWithStatementNode } from "../../../models/nodes/statements/typescript-with-statement.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class WithStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(withKeywordNode: TypeScriptWithKeywordNode): TypeScriptWithStatementNode {
    const parser = this.typescriptParser;
    parser.advance();
    const openParenthesisNode = parser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      parser.reportExpected(Resources.openParenthesis);
    const expressionNode = parser.parseExpressionAllowingIn();
    const closeParenthesisNode = parser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      parser.context.diagnosticCollector.addTypeScriptMissingClosingDelimiterDiagnostic(parser.context.source,
        parser.currentNode.span, openParenthesisNode?.span, Resources.openParenthesis, Resources.closeParenthesis);
    const statementNode = parser.parseStatement();
    parser.context.records.uncheckedSpans.push(statementNode.span);
    const resultNode = new TypeScriptWithStatementNode(withKeywordNode, expressionNode, statementNode,
      parser.typescriptLexer.reader.createSpan(withKeywordNode.span, statementNode.span),
      openParenthesisNode, closeParenthesisNode, withKeywordNode.leadingTrivia, statementNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(parser.context);
    return resultNode;
  }
}
