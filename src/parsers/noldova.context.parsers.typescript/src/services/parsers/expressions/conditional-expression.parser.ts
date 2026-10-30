/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import { TypeScriptContextFlags } from "../../../enums/typescript-context-flags.js";
import { TypeScriptColonNode } from "../../../models/nodes/delimiters/typescript-colon.node.js";
import { TypeScriptConditionalExpressionNode } from "../../../models/nodes/expressions/typescript-conditional-expression.node.js";
import { TypeScriptMissingExpressionNode } from "../../../models/nodes/expressions/typescript-missing-expression.node.js";
import { TypeScriptQuestionNode } from "../../../models/nodes/operators/typescript-question.node.js";
import { Resources } from "../../../resources.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";

export class ConditionalExpressionParser {
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
  }

  public parse(conditionNode: Node, allowsParameterAnnotation: boolean): Node {
    const typescriptParser = this.typescriptParser;
    if (allowsParameterAnnotation && this.isOptionalParameterMarker())
      return conditionNode;

    const questionNode = typescriptParser.tryConsume(TypeScriptQuestionNode);
    if (Object.isUndefined(questionNode))
      return conditionNode;

    const trueExpressionNode = this.parseTrueBranch();
    const colonNode = typescriptParser.tryConsume(TypeScriptColonNode);
    if (Object.isUndefined(colonNode))
      typescriptParser.reportExpected(Resources.colon);

    const falseExpressionNode = Object.isUndefined(colonNode)
      ? new TypeScriptMissingExpressionNode(typescriptParser.currentNode.getTypeScriptMissingNodeSpan())
      : typescriptParser.parseAssignmentExpression();
    const span = typescriptParser.typescriptLexer.reader.createSpan(conditionNode.span, falseExpressionNode.span);
    return new TypeScriptConditionalExpressionNode(
      conditionNode,
      questionNode,
      span,
      trueExpressionNode,
      falseExpressionNode,
      colonNode,
      conditionNode.leadingTrivia,
      falseExpressionNode.trailingTrivia);
  }

  private isOptionalParameterMarker(): boolean {
    const parser = this.typescriptParser;
    if (!(parser.currentNode instanceof TypeScriptQuestionNode))
      return false;

    return parser.lookAhead(() => {
      parser.advance();
      return parser.currentNode.canFollowTypeScriptOptionalParameterMarker();
    });
  }

  private parseTrueBranch(): Node {
    const context = this.typescriptParser.context;
    const previousFlags = context.contextFlags;
    context.contextFlags = (previousFlags & ~(TypeScriptContextFlags.Decorator | TypeScriptContextFlags.DisallowIn))
      | TypeScriptContextFlags.ConditionalTrueBranch;
    try {
      return this.typescriptParser.parseAssignmentExpression();
    }
    finally {
      context.contextFlags = previousFlags;
    }
  }
}
