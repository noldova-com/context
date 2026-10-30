/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCaseBlockNode,
  TypeScriptCloseBraceNode,
  TypeScriptDefaultClauseNode,
  TypeScriptDefaultKeywordNode,
  TypeScriptOpenBraceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptCaseBlockNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const node = new TypeScriptCaseBlockNode([], new SourceSpan(0, 0));

    Assert.isUndefined(node.openBraceNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const defaultClauseNode = new TypeScriptDefaultClauseNode(new TypeScriptDefaultKeywordNode(new SourceSpan(3, 7)), [], new SourceSpan(3, 7));
    const clauses = [defaultClauseNode];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(11, 1));
    const span = new SourceSpan(1, 11);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptCaseBlockNode(clauses, span, openBraceNode, closeBraceNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(clauses, node.children);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
