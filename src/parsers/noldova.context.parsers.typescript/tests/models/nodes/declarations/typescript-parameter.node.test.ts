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
  TypeScriptDotDotDotNode,
  TypeScriptEqualsNode,
  TypeScriptIdentifierNode,
  TypeScriptParameterNode,
  TypeScriptPublicKeywordNode,
  TypeScriptQuestionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptParameterNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const modifierNode = new TypeScriptPublicKeywordNode(new SourceSpan(1, 6));
    const modifierNodes: Node[] = [modifierNode];
    const dotDotDotNode = new TypeScriptDotDotDotNode(new SourceSpan(8, 3));
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(11, 5));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(16, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(17, 1));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(19, 5));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(25, 1));
    const initializerNode = new TypeScriptIdentifierNode("fallback", new SourceSpan(27, 8));
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(35, 1));
    const node = new TypeScriptParameterNode(
      modifierNodes,
      new SourceSpan(1, 34),
      nameNode,
      dotDotDotNode,
      questionNode,
      colonNode,
      typeNode,
      equalsNode,
      initializerNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(dotDotDotNode, node.dotDotDotNode);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
