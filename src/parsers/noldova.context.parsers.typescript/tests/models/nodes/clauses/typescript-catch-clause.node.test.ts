/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptCatchClauseNode,
  TypeScriptCatchKeywordNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptIdentifierNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptVariableDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptCatchClauseNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const catchKeywordNode = new TypeScriptCatchKeywordNode(new SourceSpan(0, 5));
    const blockNode = new TypeScriptBlockNode(undefined, [], new SourceSpan(5, 0));
    const node = new TypeScriptCatchClauseNode(catchKeywordNode, new SourceSpan(0, 5), blockNode);

    Assert.areEqual(blockNode, node.blockNode);
    Assert.isUndefined(node.openParenthesisNode);
    Assert.isUndefined(node.variableDeclarationNode);
    Assert.isUndefined(node.closeParenthesisNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const catchKeywordNode = new TypeScriptCatchKeywordNode(new SourceSpan(1, 5));
    const openParenthesisNode = new TypeScriptOpenParenthesisNode(new SourceSpan(7, 1));
    const variableDeclarationNode = new TypeScriptVariableDeclarationNode(new SourceSpan(8, 5), new TypeScriptIdentifierNode("error", new SourceSpan(8, 5)));
    const closeParenthesisNode = new TypeScriptCloseParenthesisNode(new SourceSpan(13, 1));
    const blockNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(15, 1)), [], new SourceSpan(15, 1));
    const span = new SourceSpan(1, 15);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptCatchClauseNode(
      catchKeywordNode,
      span,
      blockNode,
      openParenthesisNode,
      variableDeclarationNode,
      closeParenthesisNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(catchKeywordNode, node.catchKeywordNode);
    Assert.areEqual(blockNode, node.blockNode);
    Assert.areEqual(openParenthesisNode, node.openParenthesisNode);
    Assert.areEqual(variableDeclarationNode, node.variableDeclarationNode);
    Assert.areEqual(closeParenthesisNode, node.closeParenthesisNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
