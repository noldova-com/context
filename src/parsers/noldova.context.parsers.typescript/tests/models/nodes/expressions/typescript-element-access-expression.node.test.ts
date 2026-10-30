/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBracketNode,
  TypeScriptElementAccessExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptOpenBracketNode,
  TypeScriptQuestionDotNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptElementAccessExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const expressionNode = new TypeScriptIdentifierNode("target", new SourceSpan(0, 6));
    const argumentExpressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(6, 0));
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(6, 1));
    const node = new TypeScriptElementAccessExpressionNode(expressionNode, new SourceSpan(0, 7), argumentExpressionNode, openBracketNode);

    Assert.areEqual(argumentExpressionNode, node.argumentExpressionNode);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.isUndefined(node.questionDotNode);
    Assert.isUndefined(node.closeBracketNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("target", new SourceSpan(1, 6));
    const questionDotNode = new TypeScriptQuestionDotNode(new SourceSpan(7, 2));
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(9, 1));
    const argumentExpressionNode = new TypeScriptIdentifierNode("key", new SourceSpan(10, 3));
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(13, 1));
    const span = new SourceSpan(1, 13);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptElementAccessExpressionNode(
      expressionNode,
      span,
      argumentExpressionNode,
      openBracketNode,
      questionDotNode,
      closeBracketNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(questionDotNode, node.questionDotNode);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(argumentExpressionNode, node.argumentExpressionNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
