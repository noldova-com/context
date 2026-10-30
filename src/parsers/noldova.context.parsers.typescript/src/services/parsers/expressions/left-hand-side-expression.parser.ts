/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptNonNullExpressionNode } from "../../../models/nodes/expressions/typescript-non-null-expression.node.js";
import type { TypeScriptExclamationNode } from "../../../models/nodes/operators/typescript-exclamation.node.js";
import { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import { TypeScriptExpressionWithTypeArgumentsNode } from "../../../models/nodes/types/typescript-expression-with-type-arguments.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class LeftHandSideExpressionParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(expressionNode?: Node): Node {
    const parser = this.typescriptParser;
    expressionNode ??= parser.parseMemberExpression();
    let isOptionalChain = false;
    while (true) {
      isOptionalChain ||= parser.currentNode instanceof TypeScriptQuestionDotNode;
      const nextNode = parser.currentNode.parseTypeScriptLeftHandSideSuffix(parser, expressionNode);
      if (Object.isUndefined(nextNode))
        return expressionNode;

      if (isOptionalChain)
        nextNode.validateTypeScriptOptionalChain(parser.context);
      expressionNode = nextNode;
    }
  }

  public parseNonNullExpression(expressionNode: Node, exclamationNode: TypeScriptExclamationNode): TypeScriptNonNullExpressionNode {
    const parser = this.typescriptParser;
    parser.advance();
    const span = parser.typescriptLexer.reader.createSpan(expressionNode.span, exclamationNode.span);
    return new TypeScriptNonNullExpressionNode(expressionNode, exclamationNode, span, expressionNode.leadingTrivia, exclamationNode.trailingTrivia);
  }

  public tryParseInstantiationExpression(expressionNode: Node): TypeScriptExpressionWithTypeArgumentsNode | undefined {
    const parser = this.typescriptParser;
    const typeArgumentListNode = parser.tryParseTypeArgumentExpressionSuffix(expressionNode);
    if (Object.isUndefined(typeArgumentListNode))
      return undefined;
    return new TypeScriptExpressionWithTypeArgumentsNode(expressionNode,
      parser.typescriptLexer.reader.createSpan(expressionNode.span, typeArgumentListNode.span),
      typeArgumentListNode, expressionNode.leadingTrivia, typeArgumentListNode.trailingTrivia);
  }
}
