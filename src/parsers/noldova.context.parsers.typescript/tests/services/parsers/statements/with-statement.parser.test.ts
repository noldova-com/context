/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import * as api from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class WithStatementParserTests {
  @TestMethod
  public preservesExpressionAndBody(): void {
    const result = api.TypeScriptParser.parse("with(scope in scopes) label: run();");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptWithStatementNode);
    Assert.isDefined(node.openParenthesisNode);
    Assert.isInstanceOf(node.expressionNode, api.TypeScriptBinaryExpressionNode);
    Assert.isDefined(node.closeParenthesisNode);
    Assert.isInstanceOf(node.statementNode, api.TypeScriptLabeledStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1101", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(4, result.diagnostics[0]?.location?.length);
  }

  @TestData("with () {}", 6, "TS1109@6:1")
  @TestData("with ) {}", 4, "TS1005@5:1")
  @TestMethod
  public writesAMissingExpressionWhereTheSourceLacksOne(content: string, offset: number, expected: string): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptWithStatementNode);
    Assert.isInstanceOf(node.expressionNode, api.TypeScriptMissingExpressionNode);
    Assert.areEqual(offset, node.expressionNode.span.startOffset);
    Assert.areEqual(0, node.expressionNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("with () {}", "TS1109@6:1 Expression expected.")
  @TestData("with scope) {}", "TS1005@5:5 '(' expected.")
  @TestData("with(scope {}", "TS1005@11:1 ')' expected.")
  @TestData("with(scope)", "TS1109@11:0 Expression expected.")
  @TestMethod
  public recoversMissingHeaderAndBodyTokens(content: string, expected: string): void {
    const result = api.TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], api.TypeScriptWithStatementNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("with (x) { var o = { a: 1, a: 2 }; delete 1; }", "TS1101:with")
  @TestData("\"use strict\";\nwith (x) { var eval; }", "TS1101:with,TS1100:eval")
  @TestData("with (x) { function f(static) {} }", "TS1101:with,TS1212:static")
  @TestData("with (x) { label: function g() {} }", "TS1101:with,TS1344:label")
  @TestMethod
  public reportsOnlyWhatTheBinderReadsInsideItsBody(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("with (x {}", "TS1005@8:1{The parser expected to find a ')' to match the '(' token here.@5}")
  @TestData("with scope {}", "TS1005@5:5|TS1005@11:1")
  @TestMethod
  public namesTheOpenParenthesisAMissingCloseWouldMatch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(result.diagnostics));
  }
}
