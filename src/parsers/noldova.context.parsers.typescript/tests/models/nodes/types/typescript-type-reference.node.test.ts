/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptGreaterThanNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptTypeArgumentListNode,
  TypeScriptTypeReferenceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeReferenceNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const nameNode = new TypeScriptIdentifierNode("Container", new SourceSpan(1, 9));
    const argumentNode = new TypeScriptIdentifierNode("Value", new SourceSpan(11, 5));
    const typeArgumentListNode = new TypeScriptTypeArgumentListNode(
      new TypeScriptLessThanNode(new SourceSpan(10, 1)),
      [argumentNode],
      [],
      new SourceSpan(10, 7),
      new TypeScriptGreaterThanNode(new SourceSpan(16, 1)));
    const span = new SourceSpan(1, 16);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(17, 1));
    const node = new TypeScriptTypeReferenceNode(nameNode, span, typeArgumentListNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(typeArgumentListNode, node.typeArgumentListNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
