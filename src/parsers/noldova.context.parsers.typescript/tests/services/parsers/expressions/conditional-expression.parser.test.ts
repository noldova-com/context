/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptConditionalExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptQuestionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ConditionalExpressionParserTests {
  @TestData("value?: Value")
  @TestData("value?, other")
  @TestData("value?)")
  @TestData("value? = fallback")
  @TestMethod
  public leavesOptionalMarkersForParameterParsing(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseAssignmentExpressionOrParameter();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.areEqual("value", node.value);
    Assert.isInstanceOf(parser.currentNode, TypeScriptQuestionNode);
    Assert.areEqual(5, parser.currentNode.span.startOffset);
    Assert.areEqual(6, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("value ? first : second")
  @TestData("value ? (first) : second")
  @TestData("value ? [] : second")
  @TestData("value ? {} : second")
  @TestMethod
  public keepsConditionalExpressionsInPossibleParameterInput(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseAssignmentExpressionOrParameter();

    Assert.isInstanceOf(node, TypeScriptConditionalExpressionNode);
    Assert.isInstanceOf(node.falseExpressionNode, TypeScriptIdentifierNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesConditionalBranches(): void {
    const node = TypeScriptParserFixture.create("condition ? whenTrue : whenFalse").parseExpression();

    Assert.isInstanceOf(node, TypeScriptConditionalExpressionNode);
    Assert.isInstanceOf(node.trueExpressionNode, TypeScriptIdentifierNode);
    Assert.isInstanceOf(node.falseExpressionNode, TypeScriptIdentifierNode);
  }

  @TestMethod
  public reportsAMissingColon(): void {
    const parser = TypeScriptParserFixture.create("condition ? whenTrue");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptConditionalExpressionNode);
    Assert.isUndefined(node.colonNode);
    Assert.isInstanceOf(node.falseExpressionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(20, node.falseExpressionNode.span.startOffset);
    Assert.areEqual(0, node.falseExpressionNode.span.length);
    Assert.areEqual(20, node.span.endOffset);
    Assert.areEqual("TS1005@20:0 ':' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = a ? b : x in x) {}", "TS1189@47:1")
  @TestData("declare const x: any, a: any, b: any; for (a ? b : a in x;;) {}", "TS1005@57:1|TS1128@59:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = a ? a in b : b;;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = a ? () => 1 : () => 2 in x) {}", "TS1189@47:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = a ? b : (c) => a in b;;) {}", "TS1005@72:1|TS1128@74:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = a ? (c) => a in b : b;;) {}", "")
  @TestMethod
  public readsInAsAnOperatorOnlyBeforeTheColon(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
