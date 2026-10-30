/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptEnumMemberNode, TypeScriptEqualsNode, TypeScriptIdentifierNode, TypeScriptNumericLiteralNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptEnumMemberNodeTests {
  @TestMethod
  public preservesWrittenSyntaxAndTrivia(): void {
    const nameNode = new TypeScriptIdentifierNode("First", new SourceSpan(1, 5));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(7, 1));
    const initializerNode = new TypeScriptNumericLiteralNode("2", new SourceSpan(9, 1));
    const span = new SourceSpan(1, 9);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(10, 1));
    const node = new TypeScriptEnumMemberNode(nameNode, span, equalsNode, initializerNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }

  @TestMethod
  public leavesImplicitInitializersUndefined(): void {
    const nameNode = new TypeScriptIdentifierNode("First", new SourceSpan(0, 5));
    const node = new TypeScriptEnumMemberNode(nameNode, nameNode.span);

    Assert.isUndefined(node.equalsNode);
    Assert.isUndefined(node.initializerNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }
}
