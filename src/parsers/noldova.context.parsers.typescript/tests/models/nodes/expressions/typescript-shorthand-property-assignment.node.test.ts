/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptEqualsNode,
  TypeScriptExclamationNode,
  TypeScriptIdentifierNode,
  TypeScriptQuestionNode,
  TypeScriptReadonlyKeywordNode,
  TypeScriptShorthandPropertyAssignmentNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptShorthandPropertyAssignmentNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(0, 5));
    const node = new TypeScriptShorthandPropertyAssignmentNode(nameNode, new SourceSpan(0, 5));

    Assert.isUndefined(node.equalsNode);
    Assert.isUndefined(node.initializerNode);
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
    const nameNode = new TypeScriptIdentifierNode("value", new SourceSpan(10, 5));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(15, 1));
    const exclamationNode = new TypeScriptExclamationNode(new SourceSpan(16, 1));
    const equalsNode = new TypeScriptEqualsNode(new SourceSpan(18, 1));
    const initializerNode = new TypeScriptIdentifierNode("fallback", new SourceSpan(20, 8));
    const span = new SourceSpan(1, 27);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptShorthandPropertyAssignmentNode(
      nameNode,
      span,
      equalsNode,
      initializerNode,
      questionNode,
      exclamationNode,
      modifierNodes,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(nameNode, node.nameNode);
    Assert.areEqual(equalsNode, node.equalsNode);
    Assert.areEqual(initializerNode, node.initializerNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(exclamationNode, node.exclamationNode);
    Assert.areEqual(modifierNodes, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
