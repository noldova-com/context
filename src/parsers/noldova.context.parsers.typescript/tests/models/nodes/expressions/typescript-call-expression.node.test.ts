/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptArgumentListNode,
  TypeScriptCallExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptQuestionDotNode,
  TypeScriptTypeArgumentListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptCallExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const expressionNode = new TypeScriptIdentifierNode("target", new SourceSpan(0, 6));
    const argumentListNode = new TypeScriptArgumentListNode(undefined, [], [], new SourceSpan(6, 0));
    const node = new TypeScriptCallExpressionNode(expressionNode, new SourceSpan(0, 6), argumentListNode);

    Assert.areEqual(argumentListNode, node.argumentListNode);
    Assert.isUndefined(node.questionDotNode);
    Assert.isUndefined(node.typeArgumentListNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("target", new SourceSpan(1, 6));
    const questionDotNode = new TypeScriptQuestionDotNode(new SourceSpan(7, 2));
    const typeArgumentListNode = new TypeScriptTypeArgumentListNode(new TypeScriptLessThanNode(new SourceSpan(9, 1)), [], [], new SourceSpan(9, 1));
    const argumentListNode = new TypeScriptArgumentListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(10, 1)), [], [], new SourceSpan(10, 1));
    const span = new SourceSpan(1, 10);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptCallExpressionNode(expressionNode, span, argumentListNode, questionDotNode, typeArgumentListNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(questionDotNode, node.questionDotNode);
    Assert.areEqual(typeArgumentListNode, node.typeArgumentListNode);
    Assert.areEqual(argumentListNode, node.argumentListNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
