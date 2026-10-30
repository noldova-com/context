/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptBlockNode,
  TypeScriptCloseBraceNode,
  TypeScriptIdentifierNode,
  TypeScriptObjectLiteralExpressionNode,
  TypeScriptOpenBraceNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptOpenBraceNodeExtensionsTests {
  @TestMethod
  public opensADelimiterACloseBraceCloses(): void {
    Assert.areEqual(TypeScriptCloseBraceNode, new TypeScriptOpenBraceNode(new SourceSpan(0, 1)).getTypeScriptClosingDelimiterType());
  }

  @TestMethod
  public startsABindingName(): void {
    Assert.isTrue(new TypeScriptOpenBraceNode(new SourceSpan(0, 1)).canStartTypeScriptBindingName());
  }

  @TestMethod
  public canFollowAModifier(): void {
    Assert.isTrue(new TypeScriptOpenBraceNode(new SourceSpan(0, 1)).canFollowTypeScriptModifier());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ { value: 1 } /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptObjectLiteralExpressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(25, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsStatementAndLeavesTheFollowingToken(): void {
    const content = "{}";
    const prefix = " /*leading*/ ";
    const parser = TypeScriptParserFixture.create(prefix + content + " next;");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptStatement(parser);
    const followingNode = parser.currentNode;

    Assert.isInstanceOf(node, TypeScriptBlockNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(followingNode, TypeScriptIdentifierNode);
    Assert.areEqual("next", followingNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsATypeAndALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("{");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }

  @TestData("{ value: 1 }", true)
  @TestData("{} {}", true)
  @TestData("{}, B", true)
  @TestData("{} extends B", true)
  @TestData("{} implements I", true)
  @TestData("{}", false)
  @TestData("{};", false)
  @TestMethod
  public startsAHeritageExpressionUnlessAnEmptyObjectEndsTheClause(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.canStartTypeScriptHeritageExpression(parser));
    Assert.areEqual(0, parser.currentNode.span.startOffset);
  }

  @TestData("export {};", "")
  @TestData("export type { a };", "")
  @TestMethod
  public startsAnExportClause(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
