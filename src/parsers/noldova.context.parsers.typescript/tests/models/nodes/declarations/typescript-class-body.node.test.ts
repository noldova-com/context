/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptClassBodyNode,
  TypeScriptCloseBraceNode,
  TypeScriptOpenBraceNode,
  TypeScriptSemicolonClassElementNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptClassBodyNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(0, 1));
    const node = new TypeScriptClassBodyNode(openBraceNode, [], new SourceSpan(0, 1));

    Assert.isUndefined(node.closeBraceNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const memberNodes = [new TypeScriptSemicolonClassElementNode([], new TypeScriptSemicolonNode(new SourceSpan(3, 1)), new SourceSpan(3, 1))];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(5, 1));
    const span = new SourceSpan(1, 5);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptClassBodyNode(openBraceNode, memberNodes, span, closeBraceNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(memberNodes, node.children);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
