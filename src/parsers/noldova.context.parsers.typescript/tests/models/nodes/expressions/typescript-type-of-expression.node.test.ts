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
  TypeScriptMissingExpressionNode,
  TypeScriptTypeOfExpressionNode,
  TypeScriptTypeOfKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeOfExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const typeOfKeywordNode = new TypeScriptTypeOfKeywordNode(new SourceSpan(0, 6));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(6, 0));
    const node = new TypeScriptTypeOfExpressionNode(typeOfKeywordNode, new SourceSpan(0, 6), expressionNode);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const typeOfKeywordNode = new TypeScriptTypeOfKeywordNode(new SourceSpan(1, 6));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(8, 5));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptTypeOfExpressionNode(typeOfKeywordNode, span, expressionNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(typeOfKeywordNode, node.typeOfKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
