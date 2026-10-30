/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptExpressionStatementNode, TypeScriptIdentifierNode, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptExpressionStatementNodeTests {
  @TestMethod
  public constructorPreservesAnExplicitSemicolon(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(1, 5));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(6, 1));
    const span = new SourceSpan(1, 6);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptExpressionStatementNode(expressionNode, span, semicolonNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesAnAbsentSemicolon(): void {
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const node = new TypeScriptExpressionStatementNode(expressionNode, expressionNode.span);

    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(expressionNode, node.expressionNode);
  }
}
