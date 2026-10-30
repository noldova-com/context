/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBracketNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBracketNode,
  TypeScriptTupleTypeNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTupleTypeNodeTests {
  @TestMethod
  public constructorPreservesElementsDelimitersAndTrivia(): void {
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(1, 1));
    const elementNode = new TypeScriptIdentifierNode("Value", new SourceSpan(2, 5));
    const elementNodes: Node[] = [elementNode];
    const commaNode = new TypeScriptCommaNode(new SourceSpan(7, 1));
    const commaNodes = [commaNode];
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(8, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(9, 1));
    const node = new TypeScriptTupleTypeNode(
      openBracketNode,
      elementNodes,
      commaNodes,
      new SourceSpan(1, 8),
      closeBracketNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(elementNode, node.children[0]);
    Assert.areEqual(1, node.commaNodes.length);
    Assert.areEqual(commaNode, node.commaNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
