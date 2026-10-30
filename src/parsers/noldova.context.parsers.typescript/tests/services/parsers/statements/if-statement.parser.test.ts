/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptIdentifierNode,
  TypeScriptIfStatementNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser,
  TypeScriptReturnStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class IfStatementParserTests {
  @TestMethod
  public parsesConditionsAndElseStatements(): void {
    const parser = TypeScriptParserFixture.create("if (condition) return first; else return second;");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptIfStatementNode);
    Assert.isInstanceOf(node.conditionNode, TypeScriptIdentifierNode);
    Assert.isInstanceOf(node.statementNode, TypeScriptReturnStatementNode);
    Assert.isDefined(node.elseKeywordNode);
    Assert.isInstanceOf(node.elseStatementNode, TypeScriptReturnStatementNode);
    Assert.areEqual("TS1108,TS1108", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("if () statement;", 4, "TS1109@4:1")
  @TestData("if ) statement;", 2, "TS1005@3:1")
  @TestMethod
  public writesAMissingConditionWhereTheSourceLacksOne(content: string, offset: number, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptIfStatementNode);
    Assert.isInstanceOf(node.conditionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(offset, node.conditionNode.span.startOffset);
    Assert.areEqual(0, node.conditionNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("if condition) statement;", "TS1005@3:9 '(' expected.")
  @TestData("if () statement;", "TS1109@4:1 Expression expected.")
  @TestData("if (condition statement;", "TS1005@14:9 ')' expected.")
  @TestMethod
  public reportsMissingConditionSyntax(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptIfStatementNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("if (x {}", "TS1005@6:1{The parser expected to find a ')' to match the '(' token here.@3}")
  @TestData("if (x y) {}", "TS1005@6:1{The parser expected to find a ')' to match the '(' token here.@3}|TS1128@7:1")
  @TestMethod
  public namesTheOpenParenthesisAMissingCloseWouldMatch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(result.diagnostics));
  }
}
