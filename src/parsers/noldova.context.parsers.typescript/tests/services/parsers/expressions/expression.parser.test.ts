/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptBinaryExpressionNode, TypeScriptCommaNode, TypeScriptIdentifierNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ExpressionParserTests {
  @TestMethod
  public parsesCommaExpressionsWithoutAbsorbingAssignmentBoundaries(): void {
    const expressionNode = TypeScriptParserFixture.create("first, second, third").parseExpression();
    const assignmentParser = TypeScriptParserFixture.create("first, second");
    const assignmentNode = assignmentParser.parseAssignmentExpression();

    Assert.isInstanceOf(expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(expressionNode.operatorNode, TypeScriptCommaNode);
    Assert.isInstanceOf(expressionNode.leftNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(assignmentNode, TypeScriptIdentifierNode);
    Assert.areEqual("first", assignmentNode.value);
    Assert.isInstanceOf(assignmentParser.currentNode, TypeScriptCommaNode);
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = function () { if (a in b) {} };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { throw a in b; };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { do {} while (a in b); };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { while (a in b) {} };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { with (a in b) {} };;) {}", "TS1101@59:4")
  @TestMethod
  public readsInAsAnOperatorInAStatementsExpression(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
