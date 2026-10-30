/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptArrowFunctionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptFunctionExpressionNode,
  TypeScriptParser,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAsyncKeywordNodeExtensionsTests {
  @TestData("async function ready() {}", 1)
  @TestData("async /* same line */ function ready() {}", 1)
  @TestData("async\nfunction ready() {}", 2)
  @TestData("async /*\n*/ function ready() {}", 2)
  @TestMethod
  public dispatchesDeclarationsOnlyWhenFunctionFollowsOnTheSameLine(content: string, statements: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(statements, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[statements - 1], TypeScriptFunctionDeclarationNode);
    if (statements === 2)
      Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("async => async")
  @TestData("async()")
  @TestData("async;")
  @TestMethod
  public keepsOtherAsyncFormsAsExpressionStatements(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ async function() {} /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptFunctionExpressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(32, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("async;", 5)
  @TestData("async\nfunction() {}", 6)
  @TestData("async /*\n*/ function() {}", 12)
  @TestMethod
  public keepsAsyncAsANameWhenNoSameLineFunctionFollows(content: string, nextOffset: number): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.areEqual(node, expressionNode);
    Assert.areEqual(5, expressionNode.span.endOffset);
    Assert.areEqual(nextOffset, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("async function() {}")
  @TestData("async /*same line*/ function() {}")
  @TestMethod
  public recognizesSameLineFunctionExpressions(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptFunctionExpressionNode);
    Assert.areEqual(node, expressionNode.modifierNodes[0]);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "async (value) => value";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptArrowFunctionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("async").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestData("export default async function () {}", "")
  @TestData("export default async\nfunction f() {}", "")
  @TestMethod
  public followsADefaultBeforeAFunctionOnItsLine(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
