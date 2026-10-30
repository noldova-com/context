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
  TypeScriptIdentifierNode,
  TypeScriptMethodSignatureNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParameterListNode,
  TypeScriptQuestionNode,
  TypeScriptReadonlyKeywordNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptMethodSignatureNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const modifierNode = new TypeScriptReadonlyKeywordNode(new SourceSpan(1, 8));
    const modifierNodes: Node[] = [modifierNode];
    const nameNode = new TypeScriptIdentifierNode("method", new SourceSpan(10, 6));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(16, 1));
    const parameterListNode = new TypeScriptParameterListNode(
      new TypeScriptOpenParenthesisNode(new SourceSpan(17, 1)),
      [],
      [],
      new SourceSpan(17, 2),
      new TypeScriptCloseParenthesisNode(new SourceSpan(18, 1)));
    const colonNode = new TypeScriptColonNode(new SourceSpan(19, 1));
    const returnTypeNode = new TypeScriptIdentifierNode("Result", new SourceSpan(21, 6));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(27, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(28, 1));
    const node = new TypeScriptMethodSignatureNode(
      modifierNodes,
      new SourceSpan(1, 27),
      nameNode,
      parameterListNode,
      questionNode,
      undefined,
      colonNode,
      returnTypeNode,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.isUndefined(node.typeParameterListNode);
    Assert.areEqual(parameterListNode, node.parameterListNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(returnTypeNode, node.returnTypeNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
