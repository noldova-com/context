/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBracketNode,
  TypeScriptIdentifierNode,
  TypeScriptIndexedAccessTypeNode,
  TypeScriptOpenBracketNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptIndexedAccessTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const objectTypeNode = new TypeScriptIdentifierNode("Object", new SourceSpan(1, 6));
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(7, 1));
    const indexTypeNode = new TypeScriptIdentifierNode("Key", new SourceSpan(8, 3));
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(11, 1));
    const span = new SourceSpan(1, 11);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(12, 1));
    const node = new TypeScriptIndexedAccessTypeNode(
      objectTypeNode,
      openBracketNode,
      span,
      indexTypeNode,
      closeBracketNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(objectTypeNode, node.objectTypeNode);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(indexTypeNode, node.indexTypeNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
