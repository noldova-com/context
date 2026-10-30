/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptDotNode, TypeScriptIdentifierNode, TypeScriptQualifiedNameNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptQualifiedNameNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const leftNode = new TypeScriptIdentifierNode("Namespace", new SourceSpan(1, 9));
    const dotNode = new TypeScriptDotNode(new SourceSpan(10, 1));
    const rightNode = new TypeScriptIdentifierNode("Type", new SourceSpan(11, 4));
    const span = new SourceSpan(1, 14);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(15, 1));
    const node = new TypeScriptQualifiedNameNode(leftNode, dotNode, rightNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(leftNode, node.leftNode);
    Assert.areEqual(dotNode, node.dotNode);
    Assert.areEqual(rightNode, node.rightNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
