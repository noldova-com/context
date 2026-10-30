/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBraceNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptObjectLiteralExpressionNode,
  TypeScriptOpenBraceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptObjectLiteralExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(0, 1));
    const node = new TypeScriptObjectLiteralExpressionNode(openBraceNode, [], [], new SourceSpan(0, 1));

    Assert.isUndefined(node.closeBraceNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const propertyNodes = [new TypeScriptIdentifierNode("first", new SourceSpan(3, 5)), new TypeScriptIdentifierNode("second", new SourceSpan(10, 6))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(8, 1))];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(17, 1));
    const span = new SourceSpan(1, 17);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptObjectLiteralExpressionNode(openBraceNode, propertyNodes, commaNodes, span, closeBraceNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(propertyNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
