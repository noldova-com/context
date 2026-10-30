/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseParenthesisNode,
  TypeScriptElseKeywordNode,
  TypeScriptIdentifierNode,
  TypeScriptIfKeywordNode,
  TypeScriptIfStatementNode,
  TypeScriptMissingExpressionNode,
  TypeScriptOpenParenthesisNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptIfStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const ifKeywordNode = new TypeScriptIfKeywordNode(new SourceSpan(0, 2));
    const conditionNode = new TypeScriptMissingExpressionNode(new SourceSpan(2, 0));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(3, 9));
    const node = new TypeScriptIfStatementNode(ifKeywordNode, statementNode, new SourceSpan(0, 12), conditionNode);

    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.elseKeywordNode);
    Assert.isUndefined(node.elseStatementNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const ifKeywordNode = new TypeScriptIfKeywordNode(new SourceSpan(1, 2));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(4, 1));
    const conditionNode = new TypeScriptIdentifierNode("condition", new SourceSpan(5, 9));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(14, 1));
    const statementNode = new TypeScriptIdentifierNode("statement", new SourceSpan(16, 9));
    const elseKeywordNode = new TypeScriptElseKeywordNode(new SourceSpan(26, 4));
    const elseStatementNode = new TypeScriptIdentifierNode("elseStatement", new SourceSpan(31, 13));
    const span = new SourceSpan(1, 43);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptIfStatementNode(
      ifKeywordNode,
      statementNode,
      span,
      conditionNode,
      openParenthesisNode,
      closeParenthesisNode,
      elseKeywordNode,
      elseStatementNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(ifKeywordNode, node.ifKeywordNode);
    Assert.areEqual(statementNode, node.statementNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(conditionNode, node.conditionNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(elseKeywordNode, node.elseKeywordNode);
    Assert.areEqual(elseStatementNode, node.elseStatementNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
