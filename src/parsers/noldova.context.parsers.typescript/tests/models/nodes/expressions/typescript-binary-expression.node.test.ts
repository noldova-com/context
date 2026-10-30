/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBinaryExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptPlusNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBinaryExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const leftNode = new TypeScriptIdentifierNode("left", new SourceSpan(0, 4));
    const operatorNode = new TypeScriptPlusNode(new SourceSpan(5, 1));
    const rightNode = new TypeScriptMissingExpressionNode(new SourceSpan(6, 0));
    const node = new TypeScriptBinaryExpressionNode(leftNode, operatorNode, new SourceSpan(0, 6), rightNode);

    Assert.areEqual(rightNode, node.rightNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const leftNode = new TypeScriptIdentifierNode("left", new SourceSpan(1, 4));
    const operatorNode = new TypeScriptPlusNode(new SourceSpan(6, 1));
    const rightNode = new TypeScriptIdentifierNode("right", new SourceSpan(8, 5));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptBinaryExpressionNode(leftNode, operatorNode, span, rightNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(leftNode, node.leftNode);
    Assert.areEqual(operatorNode, node.operatorNode);
    Assert.areEqual(rightNode, node.rightNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
