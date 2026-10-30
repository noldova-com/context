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
  TypeScriptForInStatementNode,
  TypeScriptForKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptInKeywordNode,
  TypeScriptOpenParenthesisNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptForInStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const forKeywordNode = new TypeScriptForKeywordNode(new SourceSpan(0, 3));
    const initializerNode = new TypeScriptIdentifierNode("key", new SourceSpan(4, 3));
    const inKeywordNode = new TypeScriptInKeywordNode(new SourceSpan(8, 2));
    const expressionNode = new TypeScriptIdentifierNode("record", new SourceSpan(11, 6));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(18, 9));
    const node = new TypeScriptForInStatementNode(forKeywordNode, initializerNode, inKeywordNode, expressionNode, statementNode, new SourceSpan(0, 27));

    Assert.areEqual(inKeywordNode, node.inKeywordNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const forKeywordNode = new TypeScriptForKeywordNode(new SourceSpan(1, 3));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(5, 1));
    const initializerNode = new TypeScriptIdentifierNode("key", new SourceSpan(6, 3));
    const inKeywordNode = new TypeScriptInKeywordNode(new SourceSpan(10, 2));
    const expressionNode = new TypeScriptIdentifierNode("record", new SourceSpan(13, 6));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(19, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(21, 9));
    const span = new SourceSpan(1, 29);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptForInStatementNode(
      forKeywordNode,
      initializerNode,
      inKeywordNode,
      expressionNode,
      statementNode,
      span,
      openParenthesisNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(forKeywordNode, node.forKeywordNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(inKeywordNode, node.inKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
