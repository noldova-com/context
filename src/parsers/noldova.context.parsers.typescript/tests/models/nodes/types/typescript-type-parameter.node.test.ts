/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptConstKeywordNode,
  TypeScriptEqualsNode,
  TypeScriptExtendsKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptTypeParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeParameterNodeTests {
  @TestMethod
  public constructorPreservesSyntaxAndTrivia(): void {
    const modifierNode = new TypeScriptConstKeywordNode(new SourceSpan(1, 5));
    const modifierNodes: Node[] = [modifierNode];
    const nameNode = new TypeScriptIdentifierNode("T", new SourceSpan(7, 1));
    const constraintKeywordNode = new TypeScriptExtendsKeywordNode(new SourceSpan(9, 7));
    const constraintNode = new TypeScriptIdentifierNode("Base", new SourceSpan(17, 4));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(22, 1));
    const defaultTypeNode = new TypeScriptIdentifierNode("Default", new SourceSpan(24, 7));
    const span = new SourceSpan(1, 30);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(31, 1));
    const node = new TypeScriptTypeParameterNode(
      modifierNodes,
      nameNode,
      span,
      constraintKeywordNode,
      constraintNode,
      equalsNode,
      defaultTypeNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(1, node.modifierNodes.length);
    Assert.areEqual(modifierNode, node.modifierNodes[0]);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(constraintKeywordNode, node.constraintKeywordNode);
    Assert.areEqual(constraintNode, node.constraintNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(defaultTypeNode, node.defaultTypeNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
