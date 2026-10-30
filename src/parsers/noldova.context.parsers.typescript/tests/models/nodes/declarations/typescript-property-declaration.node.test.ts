/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptColonNode,
  TypeScriptEqualsNode,
  TypeScriptExclamationNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptPropertyDeclarationNode,
  TypeScriptQuestionNode,
  TypeScriptReadonlyKeywordNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptPropertyDeclarationNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(0, 0));
    const node = new TypeScriptPropertyDeclarationNode([], new SourceSpan(0, 0), nameNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.isUndefined(node.questionNode);
    Assert.isUndefined(node.exclamationNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.typeNode);
    Assert.isUndefined(node.equalsNode);
    Assert.isUndefined(node.initializerNode);
    Assert.isUndefined(node.terminatorNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptReadonlyKeywordNode(new SourceSpan(1, 8))];
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(10, 5));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(15, 1));
    const exclamationNode = new TypeScriptExclamationNode(new SourceSpan(16, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(17, 1));
    const typeNode = new TypeScriptIdentifierNode("Value", new SourceSpan(19, 5));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(25, 1));
    const initializerNode = new TypeScriptIdentifierNode("fallback", new SourceSpan(27, 8));
    const terminatorNode = new TypeScriptSemicolonNode(new SourceSpan(35, 1));
    const span = new SourceSpan(1, 35);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptPropertyDeclarationNode(
      modifierNodes,
      span,
      nameNode,
      questionNode,
      exclamationNode,
      colonNode,
      typeNode,
      equalsNode,
      initializerNode,
      terminatorNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(exclamationNode, node.exclamationNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(typeNode, node.typeNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(terminatorNode, node.terminatorNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
