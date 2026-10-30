/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAwaitKeywordNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptLetKeywordNode,
  TypeScriptUsingKeywordNode,
  TypeScriptVariableDeclarationListNode,
  TypeScriptVariableDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptVariableDeclarationListNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const keywordNode = new TypeScriptLetKeywordNode(new SourceSpan(0, 3));
    const node = new TypeScriptVariableDeclarationListNode(keywordNode, [], [], new SourceSpan(0, 3));

    Assert.isUndefined(node.awaitKeywordNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const awaitKeywordNode = new TypeScriptAwaitKeywordNode(new SourceSpan(1, 5));
    const keywordNode = new TypeScriptUsingKeywordNode(new SourceSpan(7, 5));
    const declarationNodes = [
      new TypeScriptVariableDeclarationNode(new SourceSpan(13, 5), new TypeScriptIdentifierNode("first", new SourceSpan(13, 5))),
      new TypeScriptVariableDeclarationNode(new SourceSpan(20, 6), new TypeScriptIdentifierNode("second", new SourceSpan(20, 6)))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(18, 1))];
    const span = new SourceSpan(1, 25);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptVariableDeclarationListNode(keywordNode, declarationNodes, commaNodes, span, awaitKeywordNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(keywordNode, node.keywordNode);
    Assert.areEqual(declarationNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(awaitKeywordNode, node.awaitKeywordNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
