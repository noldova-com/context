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
  TypeScriptMissingTypeNode,
  TypeScriptSatisfiesExpressionNode,
  TypeScriptSatisfiesKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptSatisfiesExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const satisfiesKeywordNode = new TypeScriptSatisfiesKeywordNode(new SourceSpan(6, 9));
    const typeNode = new TypeScriptMissingTypeNode(new SourceSpan(15, 0));
    const node = new TypeScriptSatisfiesExpressionNode(expressionNode, satisfiesKeywordNode, new SourceSpan(0, 15), typeNode);

    Assert.areEqual(typeNode, node.typeNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(1, 5));
    const satisfiesKeywordNode = new TypeScriptSatisfiesKeywordNode(new SourceSpan(7, 9));
    const typeNode = new TypeScriptIdentifierNode("Shape", new SourceSpan(17, 5));
    const span = new SourceSpan(1, 21);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptSatisfiesExpressionNode(expressionNode, satisfiesKeywordNode, span, typeNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(satisfiesKeywordNode, node.satisfiesKeywordNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
