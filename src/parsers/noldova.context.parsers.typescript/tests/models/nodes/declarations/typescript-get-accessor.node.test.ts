/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseParenthesisNode,
  TypeScriptColonNode,
  TypeScriptGetAccessorNode,
  TypeScriptGetKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptPublicKeywordNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptGetAccessorNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const modifierNode = new TypeScriptPublicKeywordNode(new SourceSpan(1, 6));
    const modifierNodes: Node[] = [modifierNode];
    const getKeywordNode = new TypeScriptGetKeywordNode(new SourceSpan(8, 3));
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(12, 5));
    const parameterListNode = new TypeScriptParameterListNode(
      new TypeScriptOpenParenthesisNode(new SourceSpan(17, 1)),
      [],
      [],
      new SourceSpan(17, 2),
      new TypeScriptCloseParenthesisNode(new SourceSpan(18, 1)));
    const colonNode = new TypeScriptColonNode(new SourceSpan(19, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(21, 5));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(26, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(27, 1));
    const node = new TypeScriptGetAccessorNode(
      modifierNodes,
      getKeywordNode,
      new SourceSpan(1, 26),
      nameNode,
      parameterListNode,
      undefined,
      colonNode,
      returnTypeNode,
      undefined,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(1, node.modifierNodes.length);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(getKeywordNode, node.getKeywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.isUndefined(node.bodyNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
