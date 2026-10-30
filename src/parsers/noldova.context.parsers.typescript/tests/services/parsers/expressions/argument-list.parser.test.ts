/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCallExpressionNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ArgumentListParserTests {
  @TestMethod
  public retainsBothArgumentsWhenTheirCommaIsMissing(): void {
    const parser = TypeScriptParserFixture.create("call(first second)");
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isDefined(node.argumentListNode.closeParenthesisNode);
    Assert.areEqual(2, node.argumentListNode.children.length);
    Assert.areEqual(0, node.argumentListNode.commaNodes.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual("TS1005@11:6 ',' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("call( return value;", "TS1135@6:6", 2)
  @TestData("{ call( }", "TS1135@8:1", 1)
  @TestData("[call(first ]", "TS1005@12:1", 1)
  @TestMethod
  public leavesTheEnclosingBoundaryForItsOwner(content: string, expectedDiagnostics: string, expectedStatements: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.length);
  }

  @TestMethod
  public skipsAnInvalidTokenWithoutDiscardingTheFollowingArgument(): void {
    const parser = TypeScriptParserFixture.create("call(: first)");
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isDefined(node.argumentListNode.closeParenthesisNode);
    Assert.areEqual(1, node.argumentListNode.children.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual("TS1135@5:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public parsesEmptyOrdinarySpreadAndTrailingArguments(): void {
    const emptyNode = TypeScriptParserFixture.create("call()").parseExpression();
    const populatedNode = TypeScriptParserFixture.create("call(first, ...rest,)").parseExpression();

    Assert.isInstanceOf(emptyNode, TypeScriptCallExpressionNode);
    Assert.areEqual(0, emptyNode.argumentListNode.children.length);
    Assert.isInstanceOf(populatedNode, TypeScriptCallExpressionNode);
    Assert.areEqual(2, populatedNode.argumentListNode.children.length);
    Assert.areEqual(2, populatedNode.argumentListNode.commaNodes.length);
  }

  @TestData("call(, value)", "TS1135@5:1 Argument expression expected.")
  @TestData("call(value", "TS1005@10:0 ')' expected.")
  @TestMethod
  public reportsAMissingArgumentOrClosingParenthesis(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.parseExpression();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("f(x as { ... });", "TS1131:...,TS1109:}")
  @TestMethod
  public endsAListItHoldsAtAnArgumentsStart(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = x(a in b);;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = import(a in b);;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = new x(a in b);;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = class { @dec(a in b) m() {} };;) {}", "")
  @TestMethod
  public readsInAsAnOperatorInAnArgument(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
