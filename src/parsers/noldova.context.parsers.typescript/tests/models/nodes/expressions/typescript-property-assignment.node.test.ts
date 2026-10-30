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
  TypeScriptExclamationNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptPropertyAssignmentNode,
  TypeScriptQuestionNode,
  TypeScriptReadonlyKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptPropertyAssignmentNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptMissingIdentifierNode(new SourceSpan(0, 0));
    const initializerNode = new TypeScriptMissingExpressionNode(new SourceSpan(0, 0));
    const node = new TypeScriptPropertyAssignmentNode(new SourceSpan(0, 0), nameNode, initializerNode);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.questionNode);
    Assert.isUndefined(node.exclamationNode);
    Assert.areEqual(0, node.modifierNodes.length);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const modifierNodes = [new TypeScriptReadonlyKeywordNode(new SourceSpan(1, 8))];
    const nameNode = new TypeScriptIdentifierNode("name", new SourceSpan(10, 4));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(14, 1));
    const exclamationNode = new TypeScriptExclamationNode(new SourceSpan(15, 1));
    const colonNode = new TypeScriptColonNode(new SourceSpan(16, 1));
    const initializerNode = new TypeScriptIdentifierNode("value", new SourceSpan(18, 5));
    const span = new SourceSpan(1, 22);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptPropertyAssignmentNode(
      span,
      nameNode,
      initializerNode,
      colonNode,
      questionNode,
      exclamationNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(exclamationNode, node.exclamationNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
