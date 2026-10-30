/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptAsExpressionNode, TypeScriptAsKeywordNode, TypeScriptIdentifierNode, TypeScriptMissingTypeNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptAsExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(6, 2));
    const typeNode = new TypeScriptMissingTypeNode(new SourceSpan(8, 0));
    const node = new TypeScriptAsExpressionNode(expressionNode, asKeywordNode, new SourceSpan(0, 8), typeNode);

    Assert.areEqual(typeNode, node.typeNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(1, 5));
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(7, 2));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(10, 5));
    const span = new SourceSpan(1, 14);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptAsExpressionNode(expressionNode, asKeywordNode, span, typeNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(asKeywordNode, node.asKeywordNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
