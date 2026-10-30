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
  TypeScriptExtendsKeywordNode,
  TypeScriptHeritageClauseNode,
  TypeScriptIdentifierNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDelimitedListNodeTests {
  @TestMethod
  public keepsItsElementsAsChildrenAndItsCommasApart(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const keywordNode = new TypeScriptExtendsKeywordNode(new SourceSpan(1, 7));
    const elementNodes = [new TypeScriptIdentifierNode("A", new SourceSpan(9, 1)), new TypeScriptIdentifierNode("B", new SourceSpan(12, 1))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(10, 1)), new TypeScriptCommaNode(new SourceSpan(13, 1))];
    const span = new SourceSpan(1, 13);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptHeritageClauseNode(keywordNode, elementNodes, commaNodes, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(elementNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
