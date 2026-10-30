/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptElementAccessExpressionNode, TypeScriptMissingExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ElementAccessExpressionParserTests {
  @TestMethod
  public parsesElementAccess(): void {
    const expressionNode = TypeScriptParserFixture.create("target[key]").parseExpression();

    Assert.isInstanceOf(expressionNode, TypeScriptElementAccessExpressionNode);
  }

  @TestData("target[]", "TS1011@7:0 An element access expression should take an argument.")
  @TestData("target[key", "TS1005@10:0 ']' expected.")
  @TestData("target[", "TS1109@7:0 Expression expected.")
  @TestMethod
  public reportsAMissingArgumentOrClosingBracket(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptElementAccessExpressionNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = x[a in b];;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = x?.[a in b];;) {}", "")
  @TestMethod
  public readsInAsAnOperatorInAnArgument(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("target[]")
  @TestData("target[ /* gap */ ]")
  @TestMethod
  public writesAMissingArgumentAtTheEndOfTheOpeningBracket(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptElementAccessExpressionNode);
    Assert.isInstanceOf(node.argumentExpressionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(7, node.argumentExpressionNode.span.startOffset);
    Assert.areEqual(0, node.argumentExpressionNode.span.length);
    Assert.areEqual("TS1011@7:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }
}
