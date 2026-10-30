/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseParenthesisNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptParameterListNodeTests {
  @TestMethod
  public constructorPreservesParametersDelimitersAndTrivia(): void {
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(1, 1));
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(2, 5));
    const parameterNode = new TypeScriptParameterNode([], nameNode.span, nameNode);
    const parameterNodes: TypeScriptParameterNode[] = [parameterNode];
    const commaNode = new TypeScriptCommaNode(new SourceSpan(7, 1));
    const commaNodes = [commaNode];
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(8, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(9, 1));
    const node = new TypeScriptParameterListNode(
      openParenthesisNode,
      parameterNodes,
      commaNodes,
      new SourceSpan(1, 8),
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(parameterNode, node.children[0]);
    Assert.areEqual(commaNode, node.commaNodes[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
