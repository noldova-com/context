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
  TypeScriptFinallyKeywordNode,
  TypeScriptOpenBraceNode,
  TypeScriptTryKeywordNode,
  TypeScriptTryStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTryStatementNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const tryBlockNode = new TypeScriptBlockNode(undefined, [], new SourceSpan(0, 0));
    const node = new TypeScriptTryStatementNode(undefined, new SourceSpan(0, 0), tryBlockNode);

    Assert.isUndefined(node.tryKeywordNode);
    Assert.areEqual(tryBlockNode, node.tryBlockNode);
    Assert.isUndefined(node.catchClauseNode);
    Assert.isUndefined(node.finallyKeywordNode);
    Assert.isUndefined(node.finallyBlockNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const tryKeywordNode = new TypeScriptTryKeywordNode(new SourceSpan(1, 3));
    const tryBlockNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(5, 1)), [], new SourceSpan(5, 1));
    const catchClauseNode = new TypeScriptCatchClauseNode(new TypeScriptCatchKeywordNode(new SourceSpan(7, 5)), new SourceSpan(7, 5),
      new TypeScriptBlockNode(undefined, [], new SourceSpan(12, 0)));
    const finallyKeywordNode = new TypeScriptFinallyKeywordNode(new SourceSpan(13, 7));
    const finallyBlockNode = new TypeScriptBlockNode(new TypeScriptOpenBraceNode(new SourceSpan(21, 1)), [], new SourceSpan(21, 1));
    const span = new SourceSpan(1, 21);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptTryStatementNode(
      tryKeywordNode,
      span,
      tryBlockNode,
      catchClauseNode,
      finallyKeywordNode,
      finallyBlockNode,
      leadingTrivia,
      trailingTrivia);

    Assert.areEqual(tryKeywordNode, node.tryKeywordNode);
    Assert.areEqual(tryBlockNode, node.tryBlockNode);
    Assert.areEqual(catchClauseNode, node.catchClauseNode);
    Assert.areEqual(finallyKeywordNode, node.finallyKeywordNode);
    Assert.areEqual(finallyBlockNode, node.finallyBlockNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
