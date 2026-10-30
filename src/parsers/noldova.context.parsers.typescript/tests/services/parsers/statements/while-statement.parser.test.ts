/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBlockNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser,
  TypeScriptWhileStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class WhileStatementParserTests {
  @TestMethod
  public parsesConditionsAndBodies(): void {
    const parser = TypeScriptParserFixture.create("while (condition) {}");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptWhileStatementNode);
    Assert.isInstanceOf(node.conditionNode, TypeScriptIdentifierNode);
    Assert.isInstanceOf(node.statementNode, TypeScriptBlockNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("while () statement;", 7, "TS1109@7:1")
  @TestData("while ) statement;", 5, "TS1005@6:1")
  @TestMethod
  public writesAMissingConditionWhereTheSourceLacksOne(content: string, offset: number, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptWhileStatementNode);
    Assert.isInstanceOf(node.conditionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(offset, node.conditionNode.span.startOffset);
    Assert.areEqual(0, node.conditionNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("while condition) statement;", "TS1005@6:9 '(' expected.")
  @TestData("while () statement;", "TS1109@7:1 Expression expected.")
  @TestData("while (condition statement;", "TS1005@17:9 ')' expected.")
  @TestMethod
  public reportsMissingConditionSyntax(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptWhileStatementNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("while (x {}", "TS1005@9:1{The parser expected to find a ')' to match the '(' token here.@6}")
  @TestData("while (x", "TS1005@8:0{The parser expected to find a ')' to match the '(' token here.@6}")
  @TestData("while x) {}", "TS1005@6:1")
  @TestMethod
  public namesTheOpenParenthesisAMissingCloseWouldMatch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(result.diagnostics));
  }
}
