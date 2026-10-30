/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCommaNode,
  TypeScriptGreaterThanNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptTypeArgumentListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeArgumentListNodeTests {
  @TestMethod
  public constructorPreservesArgumentsDelimitersAndTrivia(): void {
    const lessThanNode = new TypeScriptLessThanNode(new SourceSpan(1, 1));
    const argumentNode = new TypeScriptIdentifierNode("Value", new SourceSpan(2, 5));
    const argumentNodes: Node[] = [argumentNode];
    const commaNode = new TypeScriptCommaNode(new SourceSpan(7, 1));
    const commaNodes = [commaNode];
    const greaterThanNode = new TypeScriptGreaterThanNode(new SourceSpan(8, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(9, 1));
    const node = new TypeScriptTypeArgumentListNode(
      lessThanNode,
      argumentNodes,
      commaNodes,
      new SourceSpan(1, 8),
      greaterThanNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(lessThanNode, node.lessThanNode);
    Assert.areEqual(greaterThanNode, node.greaterThanNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(argumentNode, node.children[0]);
    Assert.areEqual(1, node.commaNodes.length);
    Assert.areEqual(commaNode, node.commaNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
