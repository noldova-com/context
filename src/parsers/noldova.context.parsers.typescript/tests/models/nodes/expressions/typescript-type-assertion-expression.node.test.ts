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
  TypeScriptMissingExpressionNode,
  TypeScriptMissingTypeNode,
  TypeScriptTypeAssertionExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeAssertionExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const lessThanNode = new TypeScriptLessThanNode(new SourceSpan(0, 1));
    const typeNode = new TypeScriptMissingTypeNode(new SourceSpan(1, 0));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(1, 0));
    const node = new TypeScriptTypeAssertionExpressionNode(lessThanNode, new SourceSpan(0, 1), typeNode, expressionNode);

    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.greaterThanNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const lessThanNode = new TypeScriptLessThanNode(new SourceSpan(1, 1));
    const typeNode = new TypeScriptIdentifierNode("Shape", new SourceSpan(2, 5));
    const greaterThanNode = new TypeScriptGreaterThanNode(new SourceSpan(7, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(8, 5));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptTypeAssertionExpressionNode(lessThanNode, span, typeNode, expressionNode, greaterThanNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(lessThanNode, node.lessThanNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(greaterThanNode, node.greaterThanNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
