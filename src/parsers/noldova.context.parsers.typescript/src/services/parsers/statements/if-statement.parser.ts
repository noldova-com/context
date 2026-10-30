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
import { TypeScriptElseKeywordNode } from "../../../models/nodes/keywords/typescript-else-keyword.node.js";
import type { TypeScriptIfKeywordNode } from "../../../models/nodes/keywords/typescript-if-keyword.node.js";
import { TypeScriptIfStatementNode } from "../../../models/nodes/statements/typescript-if-statement.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class IfStatementParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(ifKeywordNode: TypeScriptIfKeywordNode): TypeScriptIfStatementNode {
    this.typescriptParser.advance();
    const openParenthesisNode = this.typescriptParser.tryConsume(TypeScriptOpenParenthesisNode);
    if (Object.isUndefined(openParenthesisNode))
      this.typescriptParser.reportExpected(Resources.openParenthesis);

    const conditionNode = this.typescriptParser.parseExpressionAllowingIn();

    const closeParenthesisNode = this.typescriptParser.tryConsume(TypeScriptCloseParenthesisNode);
    if (Object.isUndefined(closeParenthesisNode))
      this.typescriptParser.context.diagnosticCollector.addTypeScriptMissingClosingDelimiterDiagnostic(this.typescriptParser.context.source,
        this.typescriptParser.currentNode.span, openParenthesisNode?.span, Resources.openParenthesis, Resources.closeParenthesis);

    const statementNode = this.typescriptParser.parseSubstatement();
    const elseKeywordNode = this.typescriptParser.tryConsume(TypeScriptElseKeywordNode);
    const elseStatementNode = Object.isUndefined(elseKeywordNode) ? undefined : this.typescriptParser.parseSubstatement();
    const endNode: Node = elseStatementNode ?? elseKeywordNode ?? statementNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(ifKeywordNode.span, endNode.span);
    return new TypeScriptIfStatementNode(
      ifKeywordNode,
      statementNode,
      span,
      conditionNode,
      openParenthesisNode,
      closeParenthesisNode,
      elseKeywordNode,
      elseStatementNode,
      ifKeywordNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
