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
  TypeScriptTypeParameterListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeParameterListNodeTests {
  @TestMethod
  public constructorPreservesParametersDelimitersAndTrivia(): void {
    const lessThanNode = new TypeScriptLessThanNode(new SourceSpan(1, 1));
    const parameterNode = new TypeScriptIdentifierNode("T", new SourceSpan(2, 1));
    const parameterNodes: Node[] = [parameterNode];
    const commaNode = new TypeScriptCommaNode(new SourceSpan(3, 1));
    const commaNodes = [commaNode];
    const greaterThanNode = new TypeScriptGreaterThanNode(new SourceSpan(4, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(5, 1));
    const node = new TypeScriptTypeParameterListNode(
      lessThanNode,
      parameterNodes,
      commaNodes,
      new SourceSpan(1, 4),
      greaterThanNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(lessThanNode, node.lessThanNode);
    Assert.areEqual(greaterThanNode, node.greaterThanNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(parameterNode, node.children[0]);
    Assert.areEqual(1, node.commaNodes.length);
    Assert.areEqual(commaNode, node.commaNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
