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
  TypeScriptMissingExpressionNode,
  TypeScriptSemicolonNode,
  TypeScriptThrowKeywordNode,
  TypeScriptThrowStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptThrowStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const throwKeywordNode = new TypeScriptThrowKeywordNode(new SourceSpan(0, 5));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(5, 0));
    const node = new TypeScriptThrowStatementNode(throwKeywordNode, new SourceSpan(0, 5), expressionNode);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.semicolonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const throwKeywordNode = new TypeScriptThrowKeywordNode(new SourceSpan(1, 5));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(7, 5));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(12, 1));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptThrowStatementNode(throwKeywordNode, span, expressionNode, semicolonNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(throwKeywordNode, node.throwKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
