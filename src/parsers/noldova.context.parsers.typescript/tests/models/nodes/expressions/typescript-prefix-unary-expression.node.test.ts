/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptMinusNode, TypeScriptNumericLiteralNode, TypeScriptPrefixUnaryExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptPrefixUnaryExpressionNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const operatorNode = new TypeScriptMinusNode(new SourceSpan(1, 1));
    const operandNode = new TypeScriptNumericLiteralNode("42", new SourceSpan(2, 2));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(4, 1));
    const node = new TypeScriptPrefixUnaryExpressionNode(
      operatorNode,
      new SourceSpan(1, 3),
      operandNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(operatorNode, node.operatorNode);
    Assert.areEqual(operandNode, node.operandNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
