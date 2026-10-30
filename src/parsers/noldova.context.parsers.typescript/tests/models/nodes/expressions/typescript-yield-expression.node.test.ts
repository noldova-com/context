/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAsteriskNode,
  TypeScriptIdentifierNode,
  TypeScriptYieldExpressionNode,
  TypeScriptYieldKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptYieldExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const yieldKeywordNode = new TypeScriptYieldKeywordNode(new SourceSpan(0, 5));
    const node = new TypeScriptYieldExpressionNode(yieldKeywordNode, new SourceSpan(0, 5));

    Assert.isUndefined(node.asteriskNode);
    Assert.isUndefined(node.expressionNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const yieldKeywordNode = new TypeScriptYieldKeywordNode(new SourceSpan(1, 5));
    const asteriskNode = new TypeScriptAsteriskNode(new SourceSpan(6, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(8, 5));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptYieldExpressionNode(yieldKeywordNode, span, asteriskNode, expressionNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(yieldKeywordNode, node.yieldKeywordNode);
    Assert.areEqual(asteriskNode, node.asteriskNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
