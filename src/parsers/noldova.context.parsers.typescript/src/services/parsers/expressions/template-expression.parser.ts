/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptCloseBraceNode } from "../../../models/nodes/delimiters/typescript-close-brace.node.js";
import { TypeScriptTemplateExpressionNode } from "../../../models/nodes/expressions/typescript-template-expression.node.js";
import { TypeScriptTemplateSpanNode } from "../../../models/nodes/expressions/typescript-template-span.node.js";
import { TypeScriptNoSubstitutionTemplateLiteralNode } from "../../../models/nodes/literals/typescript-no-substitution-template-literal.node.js";
import { TypeScriptTemplateHeadNode } from "../../../models/nodes/literals/typescript-template-head.node.js";
import { TypeScriptTemplateMiddleNode } from "../../../models/nodes/literals/typescript-template-middle.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class TemplateExpressionParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(
    node: TypeScriptNoSubstitutionTemplateLiteralNode | TypeScriptTemplateHeadNode,
    isTagged: boolean): Node {
    if (!isTagged && node.containsInvalidEscape)
      this.typescriptParser.reLexUntaggedTemplate();

    if (node instanceof TypeScriptNoSubstitutionTemplateLiteralNode) {
      this.typescriptParser.advance();
      return node;
    }

    return this.parseTemplateExpression(node, isTagged);
  }

  private parseTemplateExpression(headNode: TypeScriptTemplateHeadNode, isTagged: boolean): TypeScriptTemplateExpressionNode {
    this.typescriptParser.advance();
    const spanNodes: TypeScriptTemplateSpanNode[] = [];
    let endNode: Node = headNode;
    while (true) {
      const expressionNode = this.typescriptParser.parseExpressionAllowingIn();
      if (!(this.typescriptParser.currentNode instanceof TypeScriptCloseBraceNode)) {
        this.typescriptParser.reportExpected(Resources.closeBrace);
        const spanNode = new TypeScriptTemplateSpanNode(expressionNode, undefined, expressionNode.span, expressionNode.leadingTrivia,
          expressionNode.trailingTrivia);
        spanNodes.push(spanNode);
        endNode = spanNode;
        break;
      }

      this.typescriptParser.reLexTemplateContinuation(isTagged);
      const literalNode = this.typescriptParser.currentNode;
      this.typescriptParser.advance();
      const span = this.typescriptParser.typescriptLexer.reader.createSpan(
        expressionNode.span,
        literalNode.span);
      const spanNode = new TypeScriptTemplateSpanNode(
        expressionNode,
        literalNode,
        span,
        expressionNode.leadingTrivia,
        literalNode.trailingTrivia);
      spanNodes.push(spanNode);
      endNode = spanNode;
      if (!(literalNode instanceof TypeScriptTemplateMiddleNode))
        break;
    }

    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      headNode.span,
      endNode.span);
    return new TypeScriptTemplateExpressionNode(
      headNode,
      spanNodes,
      span,
      headNode.leadingTrivia,
      endNode.trailingTrivia);
  }
}
