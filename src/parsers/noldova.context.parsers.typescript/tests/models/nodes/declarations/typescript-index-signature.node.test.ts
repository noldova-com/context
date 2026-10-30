/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBracketNode,
  TypeScriptColonNode,
  TypeScriptIdentifierNode,
  TypeScriptIndexParameterListNode,
  TypeScriptIndexSignatureNode,
  TypeScriptOpenBracketNode,
  TypeScriptParameterNode,
  TypeScriptReadonlyKeywordNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptIndexSignatureNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const modifierNode = new TypeScriptReadonlyKeywordNode(new SourceSpan(1, 8));
    const modifierNodes: Node[] = [modifierNode];
    const parameterNameNode = new TypeScriptIdentifierNode("key", new SourceSpan(10, 3));
    const parameterNode = new TypeScriptParameterNode([], parameterNameNode.span, parameterNameNode);
    const indexParameterListNode = new TypeScriptIndexParameterListNode(
      new TypeScriptOpenBracketNode(new SourceSpan(9, 1)),
      [parameterNode],
      [],
      new SourceSpan(9, 5),
      new TypeScriptCloseBracketNode(new SourceSpan(13, 1)));
    const colonNode = new TypeScriptColonNode(new SourceSpan(14, 1));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(16, 5));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(21, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(22, 1));
    const node = new TypeScriptIndexSignatureNode(
      modifierNodes,
      indexParameterListNode,
      new SourceSpan(1, 21),
      colonNode,
      typeNode,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(1, node.modifierNodes.length);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(indexParameterListNode, node.indexParameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
