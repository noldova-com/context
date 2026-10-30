/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptAssociativity } from "../../../enums/typescript-associativity.js";
import { TypeScriptOperatorPrecedence } from "../../../enums/typescript-operator-precedence.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class BinaryExpressionParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(leftNode: Node, minimumPrecedence: number = TypeScriptOperatorPrecedence.NullishCoalescing): Node {
    const parser = this.typescriptParser;
    const context = parser.context;
    context.enterRecursion(parser.currentNode.span);
    try {
      let lastOperandNode = leftNode;
      while (true) {
        const nextNode = parser.currentNode.parseTypeScriptBinaryExpression(parser, leftNode, minimumPrecedence);
        if (Object.isUndefined(nextNode))
          return leftNode;

        leftNode = nextNode;
        if (leftNode.endsTypeScriptBinaryExpression(parser, lastOperandNode))
          return leftNode;
        if (leftNode instanceof TypeScriptBinaryExpressionNode)
          lastOperandNode = leftNode;
      }
    }
    finally {
      context.leaveRecursion();
    }
  }

  public parseOperator(operatorNode: Node, leftNode: Node, minimumPrecedence: number): Node | undefined {
    const precedence = operatorNode.getTypeScriptPrecedence();
    if (precedence < minimumPrecedence)
      return undefined;

    const parser = this.typescriptParser;
    parser.advance();
    const rightMinimumPrecedence = operatorNode.getTypeScriptAssociativity() === TypeScriptAssociativity.Right ? precedence : precedence + 1;
    const rightNode = this.parse(parser.parseUnaryExpression(), rightMinimumPrecedence);
    const span = parser.typescriptLexer.reader.createSpan(leftNode.span, rightNode.span);
    const resultNode = new TypeScriptBinaryExpressionNode(leftNode, operatorNode, span, rightNode, leftNode.leadingTrivia, rightNode.trailingTrivia);

    resultNode.validateTypeScriptGrammar(this.typescriptParser.context);
    return resultNode;
  }
}
