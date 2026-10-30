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
  TypeScriptDoKeywordNode,
  TypeScriptDoStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptSemicolonNode,
  TypeScriptWhileKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDoStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const doKeywordNode = new TypeScriptDoKeywordNode(new SourceSpan(0, 2));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(3, 9));
    const conditionNode = new TypeScriptMissingExpressionNode(new SourceSpan(12, 0));
    const node = new TypeScriptDoStatementNode(doKeywordNode, statementNode, new SourceSpan(0, 12), conditionNode);

    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.isUndefined(node.whileKeywordNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const doKeywordNode = new TypeScriptDoKeywordNode(new SourceSpan(1, 2));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(4, 9));
    const whileKeywordNode = new TypeScriptWhileKeywordNode(new SourceSpan(14, 5));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(20, 1));
    const conditionNode = new TypeScriptIdentifierNode("condition", new SourceSpan(21, 9));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(30, 1));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(31, 1));
    const span = new SourceSpan(1, 31);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptDoStatementNode(
      doKeywordNode,
      statementNode,
      span,
      conditionNode,
      whileKeywordNode,
      openParenthesisNode,
      closeParenthesisNode,
      semicolonNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(doKeywordNode, node.doKeywordNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(whileKeywordNode, node.whileKeywordNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
