/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode, TypeScriptPlusPlusNode, TypeScriptPostfixUnaryExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptPostfixUnaryExpressionNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const operandNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const operatorNode = new TypeScriptPlusPlusNode(new SourceSpan(5, 2));
    const node = new TypeScriptPostfixUnaryExpressionNode(operandNode, operatorNode, new SourceSpan(0, 7));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const operandNode = new TypeScriptIdentifierNode("value", new SourceSpan(1, 5));
    const operatorNode = new TypeScriptPlusPlusNode(new SourceSpan(6, 2));
    const span = new SourceSpan(1, 7);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptPostfixUnaryExpressionNode(operandNode, operatorNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(operandNode, node.operandNode);
    Assert.areEqual(operatorNode, node.operatorNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
