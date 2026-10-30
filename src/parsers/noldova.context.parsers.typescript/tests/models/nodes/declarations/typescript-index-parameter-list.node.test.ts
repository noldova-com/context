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
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptIndexParameterListNode,
  TypeScriptOpenBracketNode,
  TypeScriptParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptIndexParameterListNodeTests {
  @TestMethod
  public constructorPreservesParametersDelimitersAndTrivia(): void {
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(1, 1));
    const nameNode = new TypeScriptIdentifierNode("key", new SourceSpan(2, 3));
    const parameterNode = new TypeScriptParameterNode([], nameNode.span, nameNode);
    const parameterNodes: TypeScriptParameterNode[] = [parameterNode];
    const commaNode = new TypeScriptCommaNode(new SourceSpan(5, 1));
    const commaNodes = [commaNode];
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(6, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(7, 1));
    const node = new TypeScriptIndexParameterListNode(
      openBracketNode,
      parameterNodes,
      commaNodes,
      new SourceSpan(1, 6),
      closeBracketNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(parameterNode, node.children[0]);
    Assert.areEqual(commaNode, node.commaNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
