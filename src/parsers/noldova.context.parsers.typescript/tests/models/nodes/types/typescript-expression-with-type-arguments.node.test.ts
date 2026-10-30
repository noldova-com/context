/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptExpressionWithTypeArgumentsNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptTypeArgumentListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptExpressionWithTypeArgumentsNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const expressionNode = new TypeScriptIdentifierNode("Base", new SourceSpan(0, 4));
    const node = new TypeScriptExpressionWithTypeArgumentsNode(expressionNode, new SourceSpan(0, 4));

    Assert.isUndefined(node.typeArgumentListNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const expressionNode = new TypeScriptIdentifierNode("Base", new SourceSpan(1, 4));
    const typeArgumentListNode = new TypeScriptTypeArgumentListNode(new TypeScriptLessThanNode(new SourceSpan(5, 1)), [], [], new SourceSpan(5, 1));
    const span = new SourceSpan(1, 5);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptExpressionWithTypeArgumentsNode(expressionNode, span, typeArgumentListNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(typeArgumentListNode, node.typeArgumentListNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
