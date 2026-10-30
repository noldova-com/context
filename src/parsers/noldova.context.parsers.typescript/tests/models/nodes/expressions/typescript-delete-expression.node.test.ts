/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptDeleteExpressionNode,
  TypeScriptDeleteKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDeleteExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const deleteKeywordNode = new TypeScriptDeleteKeywordNode(new SourceSpan(0, 6));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(6, 0));
    const node = new TypeScriptDeleteExpressionNode(deleteKeywordNode, new SourceSpan(0, 6), expressionNode);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const deleteKeywordNode = new TypeScriptDeleteKeywordNode(new SourceSpan(1, 6));
    const expressionNode = new TypeScriptIdentifierNode("target", new SourceSpan(8, 6));
    const span = new SourceSpan(1, 13);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptDeleteExpressionNode(deleteKeywordNode, span, expressionNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(deleteKeywordNode, node.deleteKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
