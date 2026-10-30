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
  TypeScriptForKeywordNode,
  TypeScriptForStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptForStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const forKeywordNode = new TypeScriptForKeywordNode(new SourceSpan(0, 3));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(4, 9));
    const node = new TypeScriptForStatementNode(forKeywordNode, statementNode, new SourceSpan(0, 13));

    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.initializerNode);
    Assert.isUndefined(node.firstSemicolonNode);
    Assert.isUndefined(node.conditionNode);
    Assert.isUndefined(node.secondSemicolonNode);
    Assert.isUndefined(node.incrementorNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const forKeywordNode = new TypeScriptForKeywordNode(new SourceSpan(1, 3));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(5, 1));
    const initializerNode = new TypeScriptIdentifierNode("initializer", new SourceSpan(6, 11));
    const firstSemicolonNode = new TypeScriptSemicolonNode(new SourceSpan(17, 1));
    const conditionNode = new TypeScriptIdentifierNode("condition", new SourceSpan(19, 9));
    const secondSemicolonNode = new TypeScriptSemicolonNode(new SourceSpan(28, 1));
    const incrementorNode = new TypeScriptIdentifierNode("incrementor", new SourceSpan(30, 11));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(41, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(43, 9));
    const span = new SourceSpan(1, 51);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptForStatementNode(
      forKeywordNode,
      statementNode,
      span,
      openParenthesisNode,
      initializerNode,
      firstSemicolonNode,
      conditionNode,
      secondSemicolonNode,
      incrementorNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(forKeywordNode, node.forKeywordNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(firstSemicolonNode, node.firstSemicolonNode);
    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.areEqual(secondSemicolonNode, node.secondSemicolonNode);
    Assert.areEqual(incrementorNode, node.incrementorNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
