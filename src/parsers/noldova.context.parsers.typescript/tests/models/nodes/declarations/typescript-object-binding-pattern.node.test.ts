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
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptObjectBindingPatternNode,
  TypeScriptOpenBraceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptObjectBindingPatternNodeTests {
  @TestMethod
  public constructorPreservesElementsDelimitersAndTrivia(): void {
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const elementNode = new TypeScriptIdentifierNode("item", new SourceSpan(2, 4));
    const elementNodes: Node[] = [elementNode];
    const commaNode = new TypeScriptCommaNode(new SourceSpan(6, 1));
    const commaNodes = [commaNode];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(7, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(8, 1));
    const node = new TypeScriptObjectBindingPatternNode(
      openBraceNode,
      elementNodes,
      commaNodes,
      new SourceSpan(1, 7),
      closeBraceNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(elementNode, node.children[0]);
    Assert.areEqual(commaNode, node.commaNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
