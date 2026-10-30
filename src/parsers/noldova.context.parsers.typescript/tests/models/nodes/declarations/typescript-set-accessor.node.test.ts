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
  TypeScriptIdentifierNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptParameterNode,
  TypeScriptPublicKeywordNode,
  TypeScriptSemicolonNode,
  TypeScriptSetAccessorNode,
  TypeScriptSetKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptSetAccessorNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const modifierNode = new TypeScriptPublicKeywordNode(new SourceSpan(1, 6));
    const modifierNodes: Node[] = [modifierNode];
    const setKeywordNode = new TypeScriptSetKeywordNode(new SourceSpan(8, 3));
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(12, 5));
    const parameterNameNode = new TypeScriptIdentifierNode("next", new SourceSpan(18, 4));
    const parameterNode = new TypeScriptParameterNode([], parameterNameNode.span, parameterNameNode);
    const parameterListNode = new TypeScriptParameterListNode(
      new TypeScriptOpenParenthesisNode(new SourceSpan(17, 1)),
      [parameterNode],
      [],
      new SourceSpan(17, 6),
      new TypeScriptCloseParenthesisNode(new SourceSpan(22, 1)));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(23, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(24, 1));
    const node = new TypeScriptSetAccessorNode(
      modifierNodes,
      setKeywordNode,
      new SourceSpan(1, 23),
      nameNode,
      parameterListNode,
      undefined,
      undefined,
      undefined,
      undefined,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(1, node.modifierNodes.length);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(setKeywordNode, node.setKeywordNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.returnTypeNode);
    Assert.isUndefined(node.bodyNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
