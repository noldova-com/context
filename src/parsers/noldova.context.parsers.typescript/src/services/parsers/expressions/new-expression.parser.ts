/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptDiagnosticTemplates } from "../../../models/diagnostics/typescript-diagnostic-templates.js";
import { TypeScriptDotNode } from "../../../models/nodes/delimiters/typescript-dot.node.js";
import { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptMetaPropertyNode } from "../../../models/nodes/expressions/typescript-meta-property.node.js";
import { TypeScriptNewExpressionNode } from "../../../models/nodes/expressions/typescript-new-expression.node.js";
import type { TypeScriptNewKeywordNode } from "../../../models/nodes/keywords/typescript-new-keyword.node.js";
import { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import { TypeScriptExpressionWithTypeArgumentsNode } from "../../../models/nodes/types/typescript-expression-with-type-arguments.node.js";
import type { TypeScriptTypeArgumentListNode } from "../../../models/nodes/types/typescript-type-argument-list.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { PropertyNameParser } from "../names/property-name.parser.js";
import { ArgumentListParser } from "./argument-list.parser.js";

export class NewExpressionParser {
  private readonly argumentListParser: ArgumentListParser;
  private readonly propertyNameParser: PropertyNameParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(
    typescriptParser: TypeScriptSyntaxParser,
    propertyNameParser: PropertyNameParser) {
    this.typescriptParser = typescriptParser;
    this.propertyNameParser = propertyNameParser;
    this.argumentListParser = new ArgumentListParser(typescriptParser);
  }

  public parse(newKeywordNode: TypeScriptNewKeywordNode): Node {
    const context = this.typescriptParser.context;
    context.enterRecursion(this.typescriptParser.currentNode.span);
    try {
      this.typescriptParser.advance();
      const dotNode = this.typescriptParser.currentNode;
      if (dotNode instanceof TypeScriptDotNode)
        return this.parseMetaProperty(newKeywordNode, dotNode);

      let expressionNode = this.typescriptParser.parseMemberExpressionRest(this.typescriptParser.parsePrimaryExpression());
      let typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;
      if (expressionNode instanceof TypeScriptExpressionWithTypeArgumentsNode) {
        typeArgumentListNode = expressionNode.typeArgumentListNode;
        expressionNode = expressionNode.expressionNode;
      }
      if (this.typescriptParser.currentNode instanceof TypeScriptQuestionDotNode)
        context.diagnosticCollector.addTypeScriptParseDiagnostic(TypeScriptDiagnosticTemplates.TS1209, this.typescriptParser.currentNode.span,
          [this.typescriptParser.context.source.getText(expressionNode.span)]);
      const openParenthesisNode = this.typescriptParser.currentNode;
      const argumentListNode = openParenthesisNode instanceof TypeScriptOpenParenthesisNode
        ? this.argumentListParser.parse(openParenthesisNode)
        : undefined;
      const endNode = argumentListNode ?? typeArgumentListNode ?? expressionNode;
      const span = this.typescriptParser.typescriptLexer.reader.createSpan(
        newKeywordNode.span,
        endNode.span);
      return new TypeScriptNewExpressionNode(
        newKeywordNode,
        span,
        expressionNode,
        typeArgumentListNode,
        argumentListNode,
        newKeywordNode.leadingTrivia,
        endNode.trailingTrivia);
    }
    finally {
      context.leaveRecursion();
    }
  }

  private parseMetaProperty(
    newKeywordNode: TypeScriptNewKeywordNode,
    dotNode: TypeScriptDotNode): TypeScriptMetaPropertyNode {
    this.typescriptParser.advance();
    const nameNode = this.propertyNameParser.parseAccessName();
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      newKeywordNode.span,
      nameNode.span);
    const resultNode = new TypeScriptMetaPropertyNode(
      newKeywordNode,
      span,
      nameNode,
      dotNode,
      newKeywordNode.leadingTrivia,
      nameNode.trailingTrivia);

    newKeywordNode.validateTypeScriptMetaProperty(this.typescriptParser.context, resultNode);
    return resultNode;
  }
}
