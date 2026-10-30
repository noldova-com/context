/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptCallExpressionNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptParenthesizedExpressionNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptOpenParenthesisNodeExtensionsTests {
  @TestMethod
  public opensADelimiterACloseParenthesisCloses(): void {
    Assert.areEqual(TypeScriptCloseParenthesisNode, new TypeScriptOpenParenthesisNode(new SourceSpan(0, 1)).getTypeScriptClosingDelimiterType());
  }

  @TestMethod
  public startsASignature(): void {
    Assert.isTrue(new TypeScriptOpenParenthesisNode(new SourceSpan(0, 1)).canStartTypeScriptSignature());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ (value) /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(20, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "left(value)";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("(");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }
}
