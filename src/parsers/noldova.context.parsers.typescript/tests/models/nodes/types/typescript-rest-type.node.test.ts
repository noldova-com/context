/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptDotDotDotNode, TypeScriptIdentifierNode, TypeScriptRestTypeNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptRestTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const dotDotDotNode = new TypeScriptDotDotDotNode(new SourceSpan(1, 3));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(4, 5));
    const span = new SourceSpan(1, 8);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(9, 1));
    const node = new TypeScriptRestTypeNode(dotDotDotNode, span, typeNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(dotDotDotNode, node.dotDotDotNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
