/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAssertsKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptIsKeywordNode,
  TypeScriptTypePredicateNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypePredicateNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const assertsKeywordNode = new TypeScriptAssertsKeywordNode(new SourceSpan(1, 7));
    const parameterNameNode = new TypeScriptIdentifierNode("value", new SourceSpan(9, 5));
    const isKeywordNode = new TypeScriptIsKeywordNode(new SourceSpan(15, 2));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(18, 5));
    const span = new SourceSpan(1, 22);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(23, 1));
    const node = new TypeScriptTypePredicateNode(
      parameterNameNode,
      span,
      assertsKeywordNode,
      isKeywordNode,
      typeNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(assertsKeywordNode, node.assertsKeywordNode);
    Assert.areEqual(parameterNameNode, node.parameterNameNode);
    Assert.areEqual(isKeywordNode, node.isKeywordNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
