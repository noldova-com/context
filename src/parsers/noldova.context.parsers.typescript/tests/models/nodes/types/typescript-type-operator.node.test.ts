/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptIdentifierNode, TypeScriptKeyOfKeywordNode, TypeScriptTypeOperatorNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeOperatorNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const operatorNode = new TypeScriptKeyOfKeywordNode(new SourceSpan(1, 5));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(7, 5));
    const span = new SourceSpan(1, 11);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(12, 1));
    const node = new TypeScriptTypeOperatorNode(operatorNode, span, typeNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(operatorNode, node.operatorNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
