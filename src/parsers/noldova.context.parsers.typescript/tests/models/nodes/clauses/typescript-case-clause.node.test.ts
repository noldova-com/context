/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCaseClauseNode,
  TypeScriptCaseKeywordNode,
  TypeScriptColonNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptCaseClauseNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const caseKeywordNode = new TypeScriptCaseKeywordNode(new SourceSpan(0, 4));
    const expressionNode = new TypeScriptMissingExpressionNode(new SourceSpan(4, 0));
    const node = new TypeScriptCaseClauseNode(caseKeywordNode, expressionNode, [], new SourceSpan(0, 4));

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isUndefined(node.colonNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const caseKeywordNode = new TypeScriptCaseKeywordNode(new SourceSpan(1, 4));
    const expressionNode = new TypeScriptIdentifierNode("value", new SourceSpan(6, 5));
    const colonNode = new TypeScriptColonNode(new SourceSpan(11, 1));
    const statements = [new TypeScriptIdentifierNode("statement", new SourceSpan(13, 9))];
    const span = new SourceSpan(1, 21);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptCaseClauseNode(caseKeywordNode, expressionNode, statements, span, colonNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(caseKeywordNode, node.caseKeywordNode);
    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.areEqual(statements, node.children);
    Assert.areEqual(colonNode, node.colonNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
