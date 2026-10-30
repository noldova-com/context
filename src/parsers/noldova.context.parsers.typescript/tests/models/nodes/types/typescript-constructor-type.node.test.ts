/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAbstractKeywordNode,
  TypeScriptArrowNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptConstructorTypeNode,
  TypeScriptIdentifierNode,
  TypeScriptNewKeywordNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptConstructorTypeNodeTests {
  @TestMethod
  public constructorPreservesSignatureAndTrivia(): void {
    const abstractKeywordNode = new TypeScriptAbstractKeywordNode(new SourceSpan(1, 8));
    const newKeywordNode = new TypeScriptNewKeywordNode(new SourceSpan(10, 3));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(13, 1));
    const parameterNameNode = new TypeScriptIdentifierNode("value", new SourceSpan(14, 5));
    const parameterNode = new TypeScriptParameterNode([], parameterNameNode.span, parameterNameNode);
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(20, 1));
    const parameterListNode = new TypeScriptParameterListNode(
      openParenthesisNode,
      [parameterNode],
      [],
      new SourceSpan(13, 8),
      closeParenthesisNode);
    const arrowNode = new TypeScriptArrowNode(new SourceSpan(22, 2));
    const returnTypeNode = new TypeScriptIdentifierNode("Result", new SourceSpan(25, 6));
    const span = new SourceSpan(1, 30);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(31, 1));
    const node = new TypeScriptConstructorTypeNode(
      newKeywordNode,
      span,
      returnTypeNode,
      parameterListNode,
      abstractKeywordNode,
      undefined,
      arrowNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(abstractKeywordNode, node.abstractKeywordNode);
    Assert.areEqual(newKeywordNode, node.newKeywordNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(arrowNode, node.arrowNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
