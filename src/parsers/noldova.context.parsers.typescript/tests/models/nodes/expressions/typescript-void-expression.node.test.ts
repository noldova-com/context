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
  TypeScriptVoidExpressionNode,
  TypeScriptVoidKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptVoidExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const voidKeywordNode = new TypeScriptVoidKeywordNode(new SourceSpan(0, 4));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(4, 0));
    const node = new TypeScriptVoidExpressionNode(voidKeywordNode, new SourceSpan(0, 4), expressionNode);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const voidKeywordNode = new TypeScriptVoidKeywordNode(new SourceSpan(1, 4));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(6, 5));
    const span = new SourceSpan(1, 10);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptVoidExpressionNode(voidKeywordNode, span, expressionNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(voidKeywordNode, node.voidKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
