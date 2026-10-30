/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptColonNode,
  TypeScriptEqualsNode,
  TypeScriptIdentifierNode,
  TypeScriptPropertySignatureNode,
  TypeScriptQuestionNode,
  TypeScriptReadonlyKeywordNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptPropertySignatureNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const modifierNode = new TypeScriptReadonlyKeywordNode(new SourceSpan(1, 8));
    const modifierNodes: Node[] = [modifierNode];
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(10, 5));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(15, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(16, 1));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(18, 5));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(24, 1));
    const initializerNode = new TypeScriptIdentifierNode("fallback", new SourceSpan(26, 8));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(34, 1));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(35, 1));
    const node = new TypeScriptPropertySignatureNode(
      modifierNodes,
      new SourceSpan(1, 34),
      nameNode,
      questionNode,
      colonNode,
      typeNode,
      equalsNode,
      initializerNode,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
