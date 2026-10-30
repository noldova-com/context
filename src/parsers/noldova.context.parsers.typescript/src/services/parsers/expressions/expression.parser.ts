/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptCommaNode } from "../../../models/nodes/delimiters/typescript-comma.node.js";
import { TypeScriptBinaryExpressionNode } from "../../../models/nodes/expressions/typescript-binary-expression.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import type { AssignmentExpressionParser } from "./assignment-expression.parser.js";

export class ExpressionParser {
  private readonly assignmentExpressionParser: AssignmentExpressionParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser, assignmentExpressionParser: AssignmentExpressionParser) {
    this.typescriptParser = typescriptParser;
    this.assignmentExpressionParser = assignmentExpressionParser;
  }

  public parse(): Node {
    return this.parseExpression(this.typescriptParser.context.isDisallowInContext);
  }

  public parseAllowingIn(): Node {
    return this.parseExpression(false);
  }

  public parseWithoutIn(): Node {
    return this.parseExpression(true);
  }

  private parseExpression(disallowsIn: boolean): Node {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags = (previousFlags
      & ~(TypeScriptContextFlags.Decorator | TypeScriptContextFlags.ConditionalTrueBranch | TypeScriptContextFlags.DisallowIn))
      | (disallowsIn ? TypeScriptContextFlags.DisallowIn : TypeScriptContextFlags.None);
    try {
      const typescriptParser = this.typescriptParser;
      let expressionNode = this.assignmentExpressionParser.parse();
      while (typescriptParser.currentNode instanceof TypeScriptCommaNode) {
        const commaNode = typescriptParser.currentNode;
        typescriptParser.advance();
        const rightNode = this.assignmentExpressionParser.parse();
        const span = typescriptParser.typescriptLexer.reader.createSpan(
          expressionNode.span,
          rightNode.span);
        expressionNode = new TypeScriptBinaryExpressionNode(
          expressionNode,
          commaNode,
          span,
          rightNode,
          expressionNode.leadingTrivia,
          rightNode.trailingTrivia);
      }

      return expressionNode;
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }
}
