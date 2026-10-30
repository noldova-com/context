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
  TypeScriptWithKeywordNode,
  TypeScriptWithStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptWithStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const withKeywordNode = new TypeScriptWithKeywordNode(new SourceSpan(0, 4));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(4, 0));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(5, 9));
    const node = new TypeScriptWithStatementNode(withKeywordNode, expressionNode, statementNode, new SourceSpan(0, 14));

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const withKeywordNode = new TypeScriptWithKeywordNode(new SourceSpan(1, 4));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(6, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(7, 5));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(12, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(14, 9));
    const span = new SourceSpan(1, 22);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptWithStatementNode(
      withKeywordNode,
      expressionNode,
      statementNode,
      span,
      openParenthesisNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(withKeywordNode, node.withKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
