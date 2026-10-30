/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptBigIntLiteralNode, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptBigIntLiteralNodeExtensionsTests {
  @TestData("12n", "12n")
  @TestData("1_000n", "1000n")
  @TestData("0b11n", "3n")
  @TestData("0B11n", "3n")
  @TestData("0o7n", "7n")
  @TestData("0X00FFn", "0x00ffn")
  @TestData("0bn", "0n")
  @TestData("0on", "0n")
  @TestData("0xn", "0x0n")
  @TestMethod
  public formatsDiagnosticValuesWithoutChangingTheWrittenLiteral(text: string, expected: string): void {
    const node = new TypeScriptBigIntLiteralNode(text, new SourceSpan(0, text.length));
    Assert.areEqual(expected, node.getTypeScriptDiagnosticText());
    Assert.areEqual(text, node.value);
  }

  @TestMethod
  public isALiteralTypeTokenAndStartsAPropertyName(): void {
    const node = new TypeScriptBigIntLiteralNode("value", new SourceSpan(0, 5));

    Assert.isTrue(node.isTypeScriptLiteralTypeToken());
    Assert.isTrue(node.canStartTypeScriptPropertyName());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ 1n /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.areEqual(node, expressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(15, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("1n");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }
}
