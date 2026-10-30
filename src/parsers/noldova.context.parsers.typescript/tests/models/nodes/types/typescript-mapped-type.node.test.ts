/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAsKeywordNode,
  TypeScriptCloseBraceNode,
  TypeScriptCloseBracketNode,
  TypeScriptColonNode,
  TypeScriptIdentifierNode,
  TypeScriptInKeywordNode,
  TypeScriptMappedTypeNode,
  TypeScriptMinusNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenBracketNode,
  TypeScriptPlusNode,
  TypeScriptQuestionNode,
  TypeScriptReadonlyKeywordNode,
  TypeScriptSemicolonNode,
  TypeScriptTypeParameterNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptMappedTypeNodeTests {
  @TestMethod
  public constructorPreservesSyntaxMembersAndTrivia(): void {
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const readonlyOperatorNode = new TypeScriptPlusNode(new SourceSpan(3, 1));
    const readonlyKeywordNode = new TypeScriptReadonlyKeywordNode(new SourceSpan(4, 8));
    const openBracketNode = new TypeScriptOpenBracketNode(new SourceSpan(13, 1));
    const parameterNameNode = new TypeScriptIdentifierNode("K", new SourceSpan(14, 1));
    const inKeywordNode = new TypeScriptInKeywordNode(new SourceSpan(16, 2));
    const constraintNode = new TypeScriptIdentifierNode("Keys", new SourceSpan(19, 4));
    const typeParameterNode = new TypeScriptTypeParameterNode(
      [],
      parameterNameNode,
      new SourceSpan(14, 9),
      inKeywordNode,
      constraintNode);
    const asKeywordNode = new TypeScriptAsKeywordNode(new SourceSpan(24, 2));
    const nameTypeNode = new TypeScriptIdentifierNode("Name", new SourceSpan(27, 4));
    const closeBracketNode = new TypeScriptCloseBracketNode(new SourceSpan(31, 1));
    const optionalOperatorNode = new TypeScriptMinusNode(new SourceSpan(32, 1));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(33, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(34, 1));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(36, 5));
    const semicolonNode = new TypeScriptSemicolonNode(new SourceSpan(41, 1));
    const memberNode = new TypeScriptIdentifierNode("member", new SourceSpan(43, 6));
    const memberNodes: Node[] = [memberNode];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(50, 1));
    const span = new SourceSpan(1, 50);
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(51, 1));
    const node = new TypeScriptMappedTypeNode(
      openBraceNode,
      memberNodes,
      span,
      typeParameterNode,
      readonlyOperatorNode,
      readonlyKeywordNode,
      openBracketNode,
      asKeywordNode,
      nameTypeNode,
      closeBracketNode,
      optionalOperatorNode,
      questionNode,
      colonNode,
      typeNode,
      semicolonNode,
      closeBraceNode,
      leadingTrivia,
      trailingTrivia);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(readonlyOperatorNode, node.readonlyOperatorNode);
    Assert.areEqual(readonlyKeywordNode, node.readonlyKeywordNode);
    Assert.areEqual(openBracketNode, node.openBracketNode);
    Assert.areEqual(typeParameterNode, node.typeParameterNode);
    Assert.areEqual(asKeywordNode, node.asKeywordNode);
    Assert.areEqual(nameTypeNode, node.nameTypeNode);
    Assert.areEqual(closeBracketNode, node.closeBracketNode);
    Assert.areEqual(optionalOperatorNode, node.optionalOperatorNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(semicolonNode, node.semicolonNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(memberNode, node.children[0]);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
