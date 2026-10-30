/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptArgumentListNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptArgumentListNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const node = new TypeScriptArgumentListNode(undefined, [], [], new SourceSpan(0, 0));

    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(1, 1));
    const argumentNodes = [new TypeScriptIdentifierNode("first", new SourceSpan(2, 5)), new TypeScriptIdentifierNode("second", new SourceSpan(9, 6))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(7, 1))];
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(15, 1));
    const span = new SourceSpan(1, 15);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptArgumentListNode(openParenthesisNode, argumentNodes, commaNodes, span, closeParenthesisNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(argumentNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
