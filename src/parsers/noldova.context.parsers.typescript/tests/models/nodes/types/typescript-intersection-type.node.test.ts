/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptAmpersandNode, TypeScriptIdentifierNode, TypeScriptIntersectionTypeNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptIntersectionTypeNodeTests {
  @TestMethod
  public constructorPreservesTypesSeparatorsAndTrivia(): void {
    const firstTypeNode = new TypeScriptIdentifierNode("First", new SourceSpan(1, 5));
    const secondTypeNode = new TypeScriptIdentifierNode("Second", new SourceSpan(9, 6));
    const typeNodes: Node[] = [firstTypeNode, secondTypeNode];
    const ampersandNode = new TypeScriptAmpersandNode(new SourceSpan(7, 1));
    const ampersandNodes = [ampersandNode];
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(15, 1));
    const node = new TypeScriptIntersectionTypeNode(
      typeNodes,
      ampersandNodes,
      new SourceSpan(1, 14),
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(2, node.children.length);
    Assert.areEqual(firstTypeNode, node.children[0]);
    Assert.areEqual(secondTypeNode, node.children[1]);
    Assert.areEqual(1, node.ampersandNodes.length);
    Assert.areEqual(ampersandNode, node.ampersandNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
