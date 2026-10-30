/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAwaitExpressionNode,
  TypeScriptAwaitKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptAwaitExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const awaitKeywordNode = new TypeScriptAwaitKeywordNode(new SourceSpan(0, 5));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(5, 0));
    const node = new TypeScriptAwaitExpressionNode(awaitKeywordNode, new SourceSpan(0, 5), expressionNode);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const awaitKeywordNode = new TypeScriptAwaitKeywordNode(new SourceSpan(1, 5));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(7, 5));
    const span = new SourceSpan(1, 11);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptAwaitExpressionNode(awaitKeywordNode, span, expressionNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(awaitKeywordNode, node.awaitKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
