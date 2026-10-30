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
  TypeScriptMissingIdentifierNode,
  TypeScriptPropertyAccessExpressionNode,
  TypeScriptQuestionDotNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptPropertyAccessExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const expressionNode = new TypeScriptIdentifierNode("target", new SourceSpan(0, 6));
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(6, 0));
    const node = new TypeScriptPropertyAccessExpressionNode(expressionNode, undefined, new SourceSpan(0, 6), nameNode);

    Assert.isUndefined(node.accessNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("target", new SourceSpan(1, 6));
    const accessNode = new TypeScriptQuestionDotNode(new SourceSpan(7, 2));
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(9, 5));
    const span = new SourceSpan(1, 13);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptPropertyAccessExpressionNode(expressionNode, accessNode, span, nameNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(accessNode, node.accessNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
