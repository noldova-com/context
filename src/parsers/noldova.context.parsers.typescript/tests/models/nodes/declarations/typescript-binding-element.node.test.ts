/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBindingElementNode,
  TypeScriptColonNode,
  TypeScriptDotDotDotNode,
  TypeScriptEqualsNode,
  TypeScriptIdentifierNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBindingElementNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const dotDotDotNode = new TypeScriptDotDotDotNode(new SourceSpan(1, 3));
    const propertyNameNode = new TypeScriptIdentifierNode("source", new SourceSpan(4, 6));
    const colonNode = new TypeScriptColonNode(new SourceSpan(10, 1));
    const nameNode = new TypeScriptIdentifierNode("target", new SourceSpan(12, 6));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(19, 1));
    const initializerNode = new TypeScriptIdentifierNode("fallback", new SourceSpan(21, 8));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(29, 1));
    const node = new TypeScriptBindingElementNode(
      new SourceSpan(1, 28),
      nameNode,
      dotDotDotNode,
      propertyNameNode,
      colonNode,
      equalsNode,
      initializerNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(dotDotDotNode, node.dotDotDotNode);
    Assert.areEqual(propertyNameNode, node.propertyNameNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
