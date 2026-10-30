/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptGreaterThanNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptTypeArgumentListNode,
  TypeScriptTypeOfKeywordNode,
  TypeScriptTypeQueryNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeQueryNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const typeOfKeywordNode = new TypeScriptTypeOfKeywordNode(new SourceSpan(1, 6));
    const expressionNameNode = new TypeScriptIdentifierNode("value", new SourceSpan(8, 5));
    const argumentNode = new TypeScriptIdentifierNode("T", new SourceSpan(14, 1));
    const typeArgumentListNode = new TypeScriptTypeArgumentListNode(
      new TypeScriptLessThanNode(new SourceSpan(13, 1)),
      [argumentNode],
      [],
      new SourceSpan(13, 3),
      new TypeScriptGreaterThanNode(new SourceSpan(15, 1)));
    const span = new SourceSpan(1, 15);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(16, 1));
    const node = new TypeScriptTypeQueryNode(
      typeOfKeywordNode,
      span,
      expressionNameNode,
      typeArgumentListNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(typeOfKeywordNode, node.typeOfKeywordNode);
    Assert.areEqual(expressionNameNode, node.expressionNameNode);
    Assert.areEqual(typeArgumentListNode, node.typeArgumentListNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
