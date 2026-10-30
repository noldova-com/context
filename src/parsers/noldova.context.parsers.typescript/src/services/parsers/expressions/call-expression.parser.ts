/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptOpenParenthesisNode } from "../../../models/nodes/delimiters/typescript-open-parenthesis.node.js";
import { TypeScriptCallExpressionNode } from "../../../models/nodes/expressions/typescript-call-expression.node.js";
import type { TypeScriptQuestionDotNode } from "../../../models/nodes/operators/typescript-question-dot.node.js";
import { TypeScriptExpressionWithTypeArgumentsNode } from "../../../models/nodes/types/typescript-expression-with-type-arguments.node.js";
import type { TypeScriptTypeArgumentListNode } from "../../../models/nodes/types/typescript-type-argument-list.node.js";
import type { TypeScriptSyntaxParser } from "../../typescript-syntax.parser.js";
import { ArgumentListParser } from "./argument-list.parser.js";

export class CallExpressionParser {
  private readonly argumentListParser: ArgumentListParser;
  private readonly typescriptParser: TypeScriptSyntaxParser;

  public constructor(typescriptParser: TypeScriptSyntaxParser) {
    this.typescriptParser = typescriptParser;
    this.argumentListParser = new ArgumentListParser(typescriptParser);
  }

  public parse(
    expressionNode: Node,
    openParenthesisNode: TypeScriptOpenParenthesisNode | undefined,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode): TypeScriptCallExpressionNode {
    if (Object.isUndefined(questionDotNode) && Object.isUndefined(typeArgumentListNode)
      && expressionNode instanceof TypeScriptExpressionWithTypeArgumentsNode) {
      typeArgumentListNode = expressionNode.typeArgumentListNode;
      expressionNode = expressionNode.expressionNode;
    }
    const argumentListNode = this.argumentListParser.parse(openParenthesisNode);
    const span = this.typescriptParser.typescriptLexer.reader.createSpan(
      expressionNode.span,
      argumentListNode.span);
    return new TypeScriptCallExpressionNode(
      expressionNode,
      span,
      argumentListNode,
      questionDotNode,
      typeArgumentListNode,
      expressionNode.leadingTrivia,
      argumentListNode.trailingTrivia);
  }
}
