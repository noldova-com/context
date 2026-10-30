/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptArrayBindingPatternNode,
  TypeScriptCloseBracketNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptOmittedExpressionNode,
  TypeScriptOpenBracketNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptArrayBindingPatternNodeTests {
  @TestMethod
  public constructorPreservesElementsDelimitersAndTrivia(): void {
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(1, 1));
    const omittedExpressionNode = new TypeScriptOmittedExpressionNode(new SourceSpan(2, 0));
    const elementNode = new TypeScriptIdentifierNode("item", new SourceSpan(2, 4));
    const elementNodes: Node[] = [omittedExpressionNode, elementNode];
    const commaNode = new TypeScriptCommaNode(new SourceSpan(6, 1));
    const commaNodes = [commaNode];
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(7, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(8, 1));
    const node = new TypeScriptArrayBindingPatternNode(
      openBracketNode,
      elementNodes,
      commaNodes,
      new SourceSpan(1, 7),
      closeBracketNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(omittedExpressionNode, node.children[0]);
    Assert.areEqual(elementNode, node.children[1]);
    Assert.areEqual(commaNode, node.commaNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
