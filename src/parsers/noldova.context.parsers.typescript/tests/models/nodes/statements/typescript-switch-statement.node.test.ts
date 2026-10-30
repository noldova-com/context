/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCaseBlockNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptSwitchKeywordNode,
  TypeScriptSwitchStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptSwitchStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const switchKeywordNode = new TypeScriptSwitchKeywordNode(new SourceSpan(0, 6));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(6, 0));
    const caseBlockNode = new TypeScriptCaseBlockNode([], new SourceSpan(6, 0));
    const node = new TypeScriptSwitchStatementNode(switchKeywordNode, expressionNode, caseBlockNode, new SourceSpan(0, 6));

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const switchKeywordNode = new TypeScriptSwitchKeywordNode(new SourceSpan(1, 6));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(8, 1));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(9, 5));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(14, 1));
    const caseBlockNode = new TypeScriptCaseBlockNode([], new SourceSpan(15, 0));
    const span = new SourceSpan(1, 14);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptSwitchStatementNode(
      switchKeywordNode,
      expressionNode,
      caseBlockNode,
      span,
      openParenthesisNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(switchKeywordNode, node.switchKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(caseBlockNode, node.caseBlockNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
