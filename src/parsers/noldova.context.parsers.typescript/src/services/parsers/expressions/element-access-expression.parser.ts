/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptCloseBracketNode } from "../../../models/nodes/delimiters/typescript-close-bracket.node.js";
import type { TypeScriptOpenBracketNode } from "../../../models/nodes/delimiters/typescript-open-bracket.node.js";
import { TypeScriptElementAccessExpressionNode } from "../../../models/nodes/expressions/typescript-element-access-expression.node.js";
import { TypeScriptMissingExpressionNode } from "../../../models/nodes/expressions/typescript-missing-expression.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ElementAccessExpressionParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(
    expressionNode: Node,
    openBracketNode: TypeScriptOpenBracketNode,
    questionDotNode?: TypeScriptQuestionDotNode): TypeScriptElementAccessExpressionNode {
    this.typescriptParser.advance();
    const argumentExpressionNode = this.typescriptParser.currentNode instanceof TypeScriptCloseBracketNode
      ? this.reportMissingArgument(openBracketNode)
      : this.typescriptParser.parseExpressionAllowingIn();

    const closeBracketNode = this.typescriptParser.tryConsume(TypeScriptCloseBracketNode);
    if (Object.isUndefined(closeBracketNode))
      this.typescriptParser.reportExpected(Resources.closeBracket);

    const endNode = closeBracketNode ?? argumentExpressionNode;
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      expressionNode.span,
      endNode.span);
    return new TypeScriptElementAccessExpressionNode(
      expressionNode,
      span,
      argumentExpressionNode,
      openBracketNode,
      questionDotNode,
      closeBracketNode,
      expressionNode.leadingTrivia,
      endNode.trailingTrivia);
  }

  private reportMissingArgument(openBracketNode: TypeScriptOpenBracketNode): TypeScriptMissingExpressionNode {
    const parser = this.typescriptParser;
    parser.context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1011,
      parser.typescriptLexer.reader.createSpan(openBracketNode.span.endOffset, 0));
    return new TypeScriptMissingExpressionNode(parser.currentNode.getTypeScriptMissingNodeSpan());
  }
}
