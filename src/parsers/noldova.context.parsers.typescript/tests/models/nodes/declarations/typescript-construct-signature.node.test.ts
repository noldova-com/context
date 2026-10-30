/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseParenthesisNode,
  TypeScriptColonNode,
  TypeScriptConstructSignatureNode,
  TypeScriptIdentifierNode,
  TypeScriptNewKeywordNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptConstructSignatureNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const newKeywordNode = new TypeScriptNewKeywordNode(new SourceSpan(1, 3));
    const parameterListNode = new TypeScriptParameterListNode(
      new TypeScriptOpenParenthesisNode(new SourceSpan(4, 1)),
      [],
      [],
      new SourceSpan(4, 2),
      new TypeScriptCloseParenthesisNode(new SourceSpan(5, 1)));
    const colonNode = new TypeScriptColonNode(new SourceSpan(6, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Result", new SourceSpan(8, 6));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(14, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(15, 1));
    const node = new TypeScriptConstructSignatureNode(
      newKeywordNode,
      new SourceSpan(1, 14),
      parameterListNode,
      undefined,
      colonNode,
      returnTypeNode,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(newKeywordNode, node.newKeywordNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
