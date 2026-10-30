/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptTemplateExpressionNode,
  TypeScriptTemplateHeadNode,
  TypeScriptTemplateSpanNode,
  TypeScriptTemplateTailNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTemplateExpressionNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const headNode = new TypeScriptTemplateHeadNode("`before${", new SourceSpan(0, 9));
    const node = new TypeScriptTemplateExpressionNode(headNode, [], new SourceSpan(0, 9));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const headNode = new TypeScriptTemplateHeadNode("`before${", new SourceSpan(1, 9));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(10, 5));
    const literalNode = new TypeScriptTemplateTailNode("}after`", new SourceSpan(15, 7));
    const spanNodes = [new TypeScriptTemplateSpanNode(expressionNode, literalNode, new SourceSpan(10, 12))];
    const span = new SourceSpan(1, 21);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptTemplateExpressionNode(headNode, spanNodes, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(headNode, node.headNode);
    Assert.areEqual(spanNodes, node.children);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
