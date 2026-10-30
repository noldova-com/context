/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptCloseBraceNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBraceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBlockNodeTests {
  @TestMethod
  public constructorPreservesAClosedBlock(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const statementNode = new TypeScriptIdentifierNode("value", new SourceSpan(2, 5));
    const statements: Node[] = [statementNode];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(7, 1));
    const span = new SourceSpan(1, 7);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptBlockNode(openBraceNode, statements, span, closeBraceNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(statementNode, node.children[0]);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesAMissingClosingBrace(): void {
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(0, 1));
    const node = new TypeScriptBlockNode(openBraceNode, [], openBraceNode.span);

    Assert.isUndefined(node.closeBraceNode);
    Assert.areEqual(0, node.children.length);
  }
}
