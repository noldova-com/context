/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptExclamationNode, TypeScriptIdentifierNode, TypeScriptNonNullExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNonNullExpressionNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const exclamationNode = new TypeScriptExclamationNode(new SourceSpan(5, 1));
    const node = new TypeScriptNonNullExpressionNode(expressionNode, exclamationNode, new SourceSpan(0, 6));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(1, 5));
    const exclamationNode = new TypeScriptExclamationNode(new SourceSpan(6, 1));
    const span = new SourceSpan(1, 6);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptNonNullExpressionNode(expressionNode, exclamationNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(exclamationNode, node.exclamationNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
