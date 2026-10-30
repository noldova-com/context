/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseParenthesisNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParenthesizedTypeNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptParenthesizedTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(1, 1));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(2, 5));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(7, 1));
    const span = new SourceSpan(1, 7);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(8, 1));
    const node = new TypeScriptParenthesizedTypeNode(
      openParenthesisNode,
      span,
      typeNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
