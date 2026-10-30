/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptArrayLiteralExpressionNode,
  TypeScriptCloseBracketNode,
  TypeScriptElementAccessExpressionNode,
  TypeScriptOpenBracketNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptOpenBracketNodeExtensionsTests {
  @TestMethod
  public opensADelimiterACloseBracketCloses(): void {
    Assert.areEqual(TypeScriptCloseBracketNode, new TypeScriptOpenBracketNode(new SourceSpan(0, 1)).getTypeScriptClosingDelimiterType());
  }

  @TestMethod
  public startsABindingNameAndAPropertyName(): void {
    const node = new TypeScriptOpenBracketNode(new SourceSpan(0, 1));

    Assert.isTrue(node.canStartTypeScriptBindingName());
    Assert.isTrue(node.canStartTypeScriptPropertyName());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ [1] /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptArrayLiteralExpressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(16, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "left[key]";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptElementAccessExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsATypeAndALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("[");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }
}
