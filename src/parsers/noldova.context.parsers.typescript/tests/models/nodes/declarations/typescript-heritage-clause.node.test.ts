/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCommaNode,
  TypeScriptHeritageClauseNode,
  TypeScriptIdentifierNode,
  TypeScriptImplementsKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptHeritageClauseNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const keywordNode = new TypeScriptImplementsKeywordNode(new SourceSpan(0, 10));
    const node = new TypeScriptHeritageClauseNode(keywordNode, [], [], new SourceSpan(0, 10));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const keywordNode = new TypeScriptImplementsKeywordNode(new SourceSpan(1, 10));
    const typeNodes = [new TypeScriptIdentifierNode("First", new SourceSpan(12, 5)), new TypeScriptIdentifierNode("Second", new SourceSpan(19, 6))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(17, 1))];
    const span = new SourceSpan(1, 24);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptHeritageClauseNode(keywordNode, typeNodes, commaNodes, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(keywordNode, node.keywordNode);
    Assert.areEqual(typeNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
