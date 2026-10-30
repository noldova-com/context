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
  TypeScriptConditionalExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptQuestionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptConditionalExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const conditionNode = new TypeScriptIdentifierNode("condition", new SourceSpan(0, 9));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(10, 1));
    const trueExpressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(11, 0));
    const falseExpressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(11, 0));
    const node = new TypeScriptConditionalExpressionNode(conditionNode, questionNode, new SourceSpan(0, 11), trueExpressionNode, falseExpressionNode);

    Assert.areEqual(trueExpressionNode, node.trueExpressionNode);
    Assert.areEqual(falseExpressionNode, node.falseExpressionNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const conditionNode = new TypeScriptIdentifierNode("condition", new SourceSpan(1, 9));
    const questionNode = new TypeScriptQuestionNode(new SourceSpan(11, 1));
    const trueExpressionNode = new TypeScriptIdentifierNode("whenTrue", new SourceSpan(13, 8));
    const colonNode = new TypeScriptColonNode(new SourceSpan(22, 1));
    const falseExpressionNode = new TypeScriptIdentifierNode("whenFalse", new SourceSpan(24, 9));
    const span = new SourceSpan(1, 32);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptConditionalExpressionNode(
      conditionNode,
      questionNode,
      span,
      trueExpressionNode,
      falseExpressionNode,
      colonNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.areEqual(questionNode, node.questionNode);
    Assert.areEqual(trueExpressionNode, node.trueExpressionNode);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(falseExpressionNode, node.falseExpressionNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
