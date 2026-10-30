/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptReturnKeywordNode,
  TypeScriptReturnStatementNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptReturnStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const returnKeywordNode = new TypeScriptReturnKeywordNode(new SourceSpan(0, 6));
    const node = new TypeScriptReturnStatementNode(returnKeywordNode, new SourceSpan(0, 6));

    Assert.isUndefined(node.expressionNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const returnKeywordNode = new TypeScriptReturnKeywordNode(new SourceSpan(1, 6));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(8, 5));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(13, 1));
    const span = new SourceSpan(1, 13);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptReturnStatementNode(returnKeywordNode, span, expressionNode, semicolonNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(returnKeywordNode, node.returnKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
