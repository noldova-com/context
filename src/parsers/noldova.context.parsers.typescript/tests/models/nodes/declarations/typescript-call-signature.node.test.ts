/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCallSignatureNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptColonNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptCallSignatureNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const parameterListNode = new TypeScriptParameterListNode(
      new TypeScriptOpenParenthesisNode(new SourceSpan(1, 1)),
      [],
      [],
      new SourceSpan(1, 2),
      new TypeScriptCloseParenthesisNode(new SourceSpan(2, 1)));
    const colonNode = new TypeScriptColonNode(new SourceSpan(3, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Result", new SourceSpan(5, 6));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(11, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(12, 1));
    const node = new TypeScriptCallSignatureNode(
      new SourceSpan(1, 11),
      parameterListNode,
      undefined,
      colonNode,
      returnTypeNode,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);

    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
