/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAwaitKeywordNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptForKeywordNode,
  TypeScriptForOfStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptOfKeywordNode,
  TypeScriptOpenParenthesisNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptForOfStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const forKeywordNode = new TypeScriptForKeywordNode(new SourceSpan(0, 3));
    const initializerNode = new TypeScriptIdentifierNode("item", new SourceSpan(4, 4));
    const ofKeywordNode = new TypeScriptOfKeywordNode(new SourceSpan(9, 2));
    const expressionNode = new TypeScriptIdentifierNode("items", new SourceSpan(12, 5));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(18, 9));
    const node = new TypeScriptForOfStatementNode(forKeywordNode, initializerNode, ofKeywordNode, expressionNode, statementNode, new SourceSpan(0, 27));

    Assert.areEqual(ofKeywordNode, node.ofKeywordNode);
    Assert.isUndefined(node.awaitKeywordNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const forKeywordNode = new TypeScriptForKeywordNode(new SourceSpan(1, 3));
    const awaitKeywordNode = new TypeScriptAwaitKeywordNode(new SourceSpan(5, 5));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(11, 1));
    const initializerNode = new TypeScriptIdentifierNode("item", new SourceSpan(12, 4));
    const ofKeywordNode = new TypeScriptOfKeywordNode(new SourceSpan(17, 2));
    const expressionNode = new TypeScriptIdentifierNode("items", new SourceSpan(20, 5));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(25, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(27, 9));
    const span = new SourceSpan(1, 35);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptForOfStatementNode(
      forKeywordNode,
      initializerNode,
      ofKeywordNode,
      expressionNode,
      statementNode,
      span,
      awaitKeywordNode,
      openParenthesisNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(forKeywordNode, node.forKeywordNode);
    Assert.areEqual(awaitKeywordNode, node.awaitKeywordNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(ofKeywordNode, node.ofKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
