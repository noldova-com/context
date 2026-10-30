/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptArrayTypeNode,
  TypeScriptCloseBracketNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBracketNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptArrayTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const elementTypeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(1, 5));
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(6, 1));
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(7, 1));
    const span = new SourceSpan(1, 7);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(8, 1));
    const node = new TypeScriptArrayTypeNode(
      elementTypeNode,
      openBracketNode,
      closeBracketNode,
      span,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(elementTypeNode, node.elementTypeNode);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
