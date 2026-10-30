/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptCloseBraceNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptColonNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptPublicKeywordNode,
  TypeScriptSetAccessorNode,
  TypeScriptSetKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptSetKeywordNodeExtensionsTests {
  @TestMethod
  public createsASetterHoldingItselfAsTheKeyword(): void {
    const keywordNode = new TypeScriptSetKeywordNode(new SourceSpan(7, 3));
    const modifierNode = new TypeScriptPublicKeywordNode(new SourceSpan(0, 6));
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(11, 5));
    const parameterListNode = new TypeScriptParameterListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(16, 1)), [], [],
      new SourceSpan(16, 2), new TypeScriptCloseParenthesisNode(new SourceSpan(17, 1)));
    const colonNode = new TypeScriptColonNode(new SourceSpan(18, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(20, 5));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(26, 1)), [], new SourceSpan(26, 2),
      new TypeScriptCloseBraceNode(new SourceSpan(27, 1)));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 0));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(28, 1));

    const node = keywordNode.createTypeScriptAccessor([modifierNode], new SourceSpan(0, 28), nameNode, parameterListNode, undefined, colonNode,
      returnTypeNode, bodyNode, undefined, leadingTrivia, trailingTrivia);

    Assert.isInstanceOf(node, TypeScriptSetAccessorNode);
    Assert.areEqual(keywordNode, node.setKeywordNode);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(bodyNode, node.bodyNode);
    Assert.isUndefined(node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
