/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBlockNode,
  TypeScriptDoStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class DoStatementParserTests {
  @TestMethod
  public parsesBodiesAndConditions(): void {
    const parser = TypeScriptParserFixture.create("do {} while (condition);");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptDoStatementNode);
    Assert.isInstanceOf(node.statementNode, TypeScriptBlockNode);
    Assert.isDefined(node.whileKeywordNode);
    Assert.isInstanceOf(node.conditionNode, TypeScriptIdentifierNode);
    Assert.isDefined(node.semicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public placesAnOmittedConditionBeforeItsCloseParenthesis(): void {
    const parser = TypeScriptParserFixture.create("do {} while ();");

    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptDoStatementNode);
    Assert.isInstanceOf(node.conditionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(13, node.conditionNode.span.startOffset);
    Assert.areEqual(0, node.conditionNode.span.length);
    Assert.areEqual(13, node.closeParenthesisNode?.span.startOffset);
  }

  @TestData("do {} (condition);", "TS1005@6:1 'while' expected.")
  @TestData("do {} while condition);", "TS1005@12:9 '(' expected.")
  @TestData("do {} while (condition;", "TS1005@22:1 ')' expected.")
  @TestData("do {} while (condition)", "")
  @TestData("do {} while (condition", "TS1005@22:0 ')' expected.")
  @TestMethod
  public reportsMissingWhileSyntaxButNotAMissingSemicolon(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptDoStatementNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("do {} while (\n", "TS1109@13:0|TS1005@14:0")
  @TestData("do ; while (\n", "TS1109@12:0|TS1005@13:0")
  @TestData("do ; while\n", "TS1109@10:0|TS1005@11:0|TS1005@11:0")
  @TestData("do {\n", "TS1109@4:0|TS1005@5:0|TS1005@5:0")
  @TestData("do ; while ();\n", "TS1109@12:1")
  @TestData("do x(); while (;\n", "TS1109@15:1")
  @TestData("do ; while (a\n", "TS1005@14:0")
  @TestMethod
  public reportsTheCloseParenthesisAfterAMissingCondition(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("do {} while (x;", "TS1005@14:1{The parser expected to find a ')' to match the '(' token here.@12}")
  @TestData("do {} while (x {", "TS1005@15:1{The parser expected to find a ')' to match the '(' token here.@12}|TS1005@16:0{The parser expected to find a '}' to match the '{' token here.@15}")
  @TestData("do {} while ();", "TS1109@13:1")
  @TestMethod
  public namesTheOpenParenthesisAMissingCloseWouldMatch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(result.diagnostics));
  }
}
