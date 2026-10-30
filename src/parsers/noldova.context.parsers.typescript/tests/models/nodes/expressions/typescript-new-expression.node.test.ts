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
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptMissingExpressionNode,
  TypeScriptNewExpressionNode,
  TypeScriptNewKeywordNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptTypeArgumentListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNewExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const newKeywordNode = new TypeScriptNewKeywordNode(new SourceSpan(0, 3));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(3, 0));
    const node = new TypeScriptNewExpressionNode(newKeywordNode, new SourceSpan(0, 3), expressionNode);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.typeArgumentListNode);
    Assert.isUndefined(node.argumentListNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const newKeywordNode = new TypeScriptNewKeywordNode(new SourceSpan(1, 3));
    const expressionNode = new TypeScriptIdentifierNode("Target", new SourceSpan(5, 6));
    const typeArgumentListNode = new TypeScriptTypeArgumentListNode(new TypeScriptLessThanNode(new SourceSpan(11, 1)), [], [], new SourceSpan(11, 1));
    const argumentListNode = new TypeScriptArgumentListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(12, 1)), [], [], new SourceSpan(12, 1));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptNewExpressionNode(newKeywordNode, span, expressionNode, typeArgumentListNode, argumentListNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(newKeywordNode, node.newKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(typeArgumentListNode, node.typeArgumentListNode);
    Assert.areEqual(argumentListNode, node.argumentListNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
