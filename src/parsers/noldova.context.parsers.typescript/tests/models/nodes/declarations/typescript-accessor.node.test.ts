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
  TypeScriptCommaNode,
  TypeScriptGetAccessorNode,
  TypeScriptGetKeywordNode,
  TypeScriptGreaterThanNode,
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptSetAccessorNode,
  TypeScriptSetKeywordNode,
  TypeScriptTypeParameterListNode,
  TypeScriptTypeParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptAccessorNodeTests {
  @TestMethod
  public holdsTheSharedRolesOfEitherAccessorKind(): void {
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(4, 5));
    const typeParameterListNode = new TypeScriptTypeParameterListNode(new TypeScriptLessThanNode(new SourceSpan(9, 1)),
      [new TypeScriptTypeParameterNode([], new TypeScriptIdentifierNode("T", new SourceSpan(10, 1)), new SourceSpan(10, 1))], [], new SourceSpan(9, 3),
      new TypeScriptGreaterThanNode(new SourceSpan(11, 1)));
    const parameterListNode = new TypeScriptParameterListNode(new TypeScriptOpenParenthesisNode(new SourceSpan(12, 1)), [], [],
      new SourceSpan(12, 2), new TypeScriptCloseParenthesisNode(new SourceSpan(13, 1)));
    const bodyNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(15, 1)), [], new SourceSpan(15, 2),
      new TypeScriptCloseBraceNode(new SourceSpan(16, 1)));
    const terminatorNode = new TypeScriptCommaNode(new SourceSpan(17, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 0));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(18, 1));

    const getNode = new TypeScriptGetAccessorNode([], new TypeScriptGetKeywordNode(new SourceSpan(0, 3)), new SourceSpan(0, 18), nameNode,
      parameterListNode, typeParameterListNode, undefined, undefined, bodyNode, terminatorNode, leadingTrivia, trailingTrivia);
    const missingParameterListNode = new TypeScriptParameterListNode(undefined, [], [], new SourceSpan(9, 0));
    const setNode = new TypeScriptSetAccessorNode([], new TypeScriptSetKeywordNode(new SourceSpan(0, 3)), new SourceSpan(0, 9), nameNode,
      missingParameterListNode);

    for (const node of [getNode, setNode])
      Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(typeParameterListNode, getNode.typeParameterListNode);
    Assert.areEqual(parameterListNode, getNode.parameterListNode);
    Assert.areEqual(bodyNode, getNode.bodyNode);
    Assert.areEqual(terminatorNode, getNode.terminatorNode);
    Assert.areEqual(leadingTrivia, getNode.leadingTrivia);
    Assert.areEqual(trailingTrivia, getNode.trailingTrivia);
    Assert.isUndefined(setNode.typeParameterListNode);
    Assert.areEqual(missingParameterListNode, setNode.parameterListNode);
    Assert.isUndefined(setNode.bodyNode);
    Assert.isUndefined(setNode.terminatorNode);
  }
}
