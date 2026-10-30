/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptExclamationNode,
  TypeScriptNonNullExpressionNode,
  TypeScriptPlusNode,
  TypeScriptPrefixUnaryExpressionNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptExclamationNodeExtensionsTests {
  @TestMethod
  public isAPrefixUnaryOperator(): void {
    const node = new TypeScriptExclamationNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptPrefixUnaryOperator());
  }

  @TestMethod
  public parsesItsUnaryExpressionBeforeABinaryOperator(): void {
    const prefix = " /*leading*/ ";
    const content = "!value";
    const parser = TypeScriptParserFixture.create(prefix + content + " + following");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptUnaryExpression(parser);

    Assert.isInstanceOf(node, TypeScriptPrefixUnaryExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptPlusNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "left!";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptNonNullExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsAType(): void {
    const parser = TypeScriptParserFixture.create("!");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
  }

  @TestData("var o = { a!: 1 };", "TS1255@11:1")
  @TestMethod
  public marksNoObjectLiteralMemberDefinite(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
