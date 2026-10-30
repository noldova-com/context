/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptTemplateHeadNode,
  TypeScriptTemplateLiteralTypeNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTemplateLiteralTypeNodeTests {
  @TestMethod
  public constructorPreservesHeadSpansAndTrivia(): void {
    const headNode = new TypeScriptTemplateHeadNode("head", new SourceSpan(1, 7));
    const spanNode = new TypeScriptIdentifierNode("span", new SourceSpan(8, 4));
    const spanNodes: Node[] = [spanNode];
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(12, 1));
    const node = new TypeScriptTemplateLiteralTypeNode(
      headNode,
      spanNodes,
      new SourceSpan(1, 11),
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(headNode, node.headNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(spanNode, node.children[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
