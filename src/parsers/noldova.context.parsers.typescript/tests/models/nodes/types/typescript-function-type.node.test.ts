/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptArrowNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptFunctionTypeNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptFunctionTypeNodeTests {
  @TestMethod
  public constructorPreservesSignatureAndTrivia(): void {
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(1, 1));
    const parameterNameNode = new TypeScriptIdentifierNode("value", new SourceSpan(2, 5));
    const parameterNode = new TypeScriptParameterNode([], parameterNameNode.span, parameterNameNode);
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(8, 1));
    const parameterListNode = new TypeScriptParameterListNode(
      openParenthesisNode,
      [parameterNode],
      [],
      new SourceSpan(1, 8),
      closeParenthesisNode);
    const arrowNode = new TypeScriptArrowNode(new SourceSpan(10, 2));
    const returnTypeNode = new TypeScriptIdentifierNode("Result", new SourceSpan(13, 6));
    const span = new SourceSpan(1, 18);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(19, 1));
    const node = new TypeScriptFunctionTypeNode(
      span,
      returnTypeNode,
      parameterListNode,
      undefined,
      arrowNode,
      leadingTrivia,
      trailingTrivia);

    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(arrowNode, node.arrowNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
