/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptNumericLiteralNode, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptNumericLiteralNodeExtensionsTests {
  @TestData("1_000", "1000")
  @TestData("0xff", "255")
  @TestData("0XFF", "255")
  @TestData("1e2", "100")
  @TestData(".5", "0.5")
  @TestData("0b11", "3")
  @TestData("0o7", "7")
  @TestData("077", "63")
  @TestData("0_77", "77")
  @TestData("0x", "0")
  @TestData("0b", "0")
  @TestData("0o", "0")
  @TestData("1e+", "1")
  @TestMethod
  public formatsDiagnosticValuesWithoutChangingTheWrittenLiteral(text: string, expected: string): void {
    const node = new TypeScriptNumericLiteralNode(text, new SourceSpan(0, text.length));
    Assert.areEqual(expected, node.getTypeScriptDiagnosticText());
    Assert.areEqual(text, node.value);
  }

  @TestMethod
  public isALiteralTypeTokenAndStartsAPropertyName(): void {
    const node = new TypeScriptNumericLiteralNode("value", new SourceSpan(0, 5));

    Assert.isTrue(node.isTypeScriptLiteralTypeToken());
    Assert.isTrue(node.canStartTypeScriptPropertyName());
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ 42 /*trailing*/ ;");
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
    const parser = TypeScriptParserFixture.create("1");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }
}
