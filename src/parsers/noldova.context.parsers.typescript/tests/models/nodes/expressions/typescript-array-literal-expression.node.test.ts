/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptArrayLiteralExpressionNode,
  TypeScriptCloseBracketNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBracketNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptArrayLiteralExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(0, 1));
    const node = new TypeScriptArrayLiteralExpressionNode(openBracketNode, [], [], new SourceSpan(0, 1));

    Assert.isUndefined(node.closeBracketNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(1, 1));
    const elementNodes = [new TypeScriptIdentifierNode("first", new SourceSpan(2, 5)), new TypeScriptIdentifierNode("second", new SourceSpan(9, 6))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(7, 1))];
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(15, 1));
    const span = new SourceSpan(1, 15);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptArrayLiteralExpressionNode(openBracketNode, elementNodes, commaNodes, span, closeBracketNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(elementNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
