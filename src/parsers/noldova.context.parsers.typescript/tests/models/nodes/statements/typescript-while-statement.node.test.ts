/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseParenthesisNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptWhileKeywordNode,
  TypeScriptWhileStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptWhileStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const whileKeywordNode = new TypeScriptWhileKeywordNode(new SourceSpan(0, 5));
    const conditionNode = new TypeScriptMissingExpressionNode(new SourceSpan(5, 0));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(6, 9));
    const node = new TypeScriptWhileStatementNode(whileKeywordNode, statementNode, new SourceSpan(0, 15), conditionNode);

    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const whileKeywordNode = new TypeScriptWhileKeywordNode(new SourceSpan(1, 5));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(7, 1));
    const conditionNode = new TypeScriptIdentifierNode("condition", new SourceSpan(8, 9));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(17, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(19, 9));
    const span = new SourceSpan(1, 27);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptWhileStatementNode(
      whileKeywordNode,
      statementNode,
      span,
      conditionNode,
      openParenthesisNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(whileKeywordNode, node.whileKeywordNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
