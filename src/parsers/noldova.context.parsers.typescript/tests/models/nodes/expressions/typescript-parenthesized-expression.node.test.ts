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
  TypeScriptParenthesizedExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptParenthesizedExpressionNodeTests {
  @TestMethod
  public constructorPreservesCompleteSyntaxRoles(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(1, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(2, 5));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(7, 1));
    const span = new SourceSpan(1, 7);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptParenthesizedExpressionNode(
      openParenthesisNode,
      expressionNode,
      closeParenthesisNode,
      span,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesMissingSyntaxRoles(): void {
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(0, 1));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(1, 0));
    const node = new TypeScriptParenthesizedExpressionNode(openParenthesisNode, expressionNode, undefined, openParenthesisNode.span);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.closeParenthesisNode);
  }
}
