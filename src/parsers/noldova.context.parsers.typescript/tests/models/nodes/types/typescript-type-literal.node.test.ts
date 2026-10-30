/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBraceNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBraceNode,
  TypeScriptTypeLiteralNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeLiteralNodeTests {
  @TestMethod
  public constructorPreservesMembersDelimitersAndTrivia(): void {
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const memberNode = new TypeScriptIdentifierNode("member", new SourceSpan(2, 6));
    const memberNodes: Node[] = [memberNode];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(8, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(9, 1));
    const node = new TypeScriptTypeLiteralNode(
      openBraceNode,
      memberNodes,
      new SourceSpan(1, 8),
      closeBraceNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(memberNode, node.children[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
