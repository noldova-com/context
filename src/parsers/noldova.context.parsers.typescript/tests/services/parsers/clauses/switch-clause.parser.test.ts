/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import * as api from "@noldova/context.parsers.typescript";
import { TypeScriptListKind } from "@noldova/context.parsers.typescript/enums/typescript-list-kind.js";
import { TypeScriptRecursionLimitException } from "@noldova/context.parsers.typescript/exceptions/typescript-recursion-limit.exception.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class SwitchClauseParserTests {
  @TestMethod
  public skipsStrayClosingTokensWithinAClauseWithAStatementDiagnostic(): void {
    const result = api.TypeScriptParser.parse("switch(x){case 1: ) run(); default:}");
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, api.TypeScriptSwitchStatementNode);
    const first = statement.caseBlockNode.children[0];
    Assert.isInstanceOf(first, api.TypeScriptCaseClauseNode);
    Assert.areEqual(1, first.children.length);
    Assert.areEqual(2, statement.caseBlockNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1129", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public leavesForAnEnclosingClassBodyAtATokenThatStartsAMember(): void {
    const result = api.TypeScriptParser.parse("declare var x: any;\nclass C { m() { switch (x) { case 1: else } } }");
    Assert.areEqual("TS1129,TS1128,TS1128", result.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual("57,64,66", result.diagnostics.map(t => t.location?.start).join(","));
  }

  @TestMethod
  public restoresNestedRecoveryScopesOnReturnRollbackAndFailure(): void {
    const parser = TypeScriptParserFixture.create("switch(x){case 1: switch(y){default:;} default:;}");
    const flags = parser.context.contextFlags;
    const rootArrows = parser.context.getRejectedArrowOffsets(flags);
    parser.context.enterList(TypeScriptListKind.SwitchClauseStatements);
    const clauseArrows = parser.context.getRejectedArrowOffsets(flags);
    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual(clauseArrows, parser.context.getRejectedArrowOffsets(flags));
      return true;
    });
    Assert.areEqual(clauseArrows, parser.context.getRejectedArrowOffsets(flags));
    parser.context.leaveList();
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(rootArrows, parser.context.getRejectedArrowOffsets(flags));
    parser.parseStatement();
    Assert.areEqual(rootArrows, parser.context.getRejectedArrowOffsets(flags));
    const limited = TypeScriptParserFixture.create("switch(x){case 1:" + "{".repeat(600));
    const limitedArrows = limited.context.getRejectedArrowOffsets(flags);
    Assert.throws(() => limited.parseStatement(), TypeScriptRecursionLimitException);
    Assert.areEqual(limitedArrows, limited.context.getRejectedArrowOffsets(flags));
  }

  @TestMethod
  public storesOnlyStatementsInClauseChildren(): void {
    const result = api.TypeScriptParser.parse("switch(x){case 1: run(); break; default: stop();}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    const first = node.caseBlockNode.children[0];
    const second = node.caseBlockNode.children[1];
    Assert.isInstanceOf(first, api.TypeScriptCaseClauseNode);
    Assert.isInstanceOf(first.expressionNode, api.TypeScriptNumericLiteralNode);
    Assert.areEqual("1", first.expressionNode.value);
    Assert.isDefined(first.colonNode);
    Assert.areEqual(2, first.children.length);
    Assert.isInstanceOf(second, api.TypeScriptDefaultClauseNode);
    Assert.areEqual(1, second.children.length);
    Assert.isDefined(second.colonNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("switch(x){case : break;}", "TS1109@15:1")
  @TestData("switch(x){case 1 break;}", "TS1005@17:5")
  @TestData("switch(x){default break;}", "TS1005@18:5")
  @TestData("switch(x){case 1", "TS1005@16:0")
  @TestData("switch(x){default", "TS1005@17:0")
  @TestMethod
  public retainsMalformedClausesAndStopsAtEndOfInput(content: string, expected: string): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(1, node.caseBlockNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public preservesFallThroughDuplicateDefaultsAndLexicalErrors(): void {
    const result = api.TypeScriptParser.parse("switch(x){case 1: case 2: §; default: default:}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(4, node.caseBlockNode.children.length);
    const first = node.caseBlockNode.children[0];
    Assert.isInstanceOf(first, api.TypeScriptCaseClauseNode);
    Assert.areEqual(0, first.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1127", result.diagnostics[0]?.code.displayText);
  }

  @TestData("switch (x) { case 1: readonly value = 1; }", "TS1129@21:8")
  @TestData("switch (x) { case 1: static value = 1; }", "TS1129@21:6")
  @TestData("switch (x) { default: accessor value = 1; }", "TS1129@22:8")
  @TestData("class C { m() { switch (x) { case 1: readonly y = 1; } } }", "TS1129@37:8|TS1128@55:1|TS1128@57:1")
  @TestData("switch (x) { case 1: readonly; }", "")
  @TestMethod
  public reportsAClassMemberModifierWrittenWhereAClauseHoldsStatements(content: string, expected: string): void {
    const result = api.TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("switch (x) { case 1: f(a, case 2: }", "TS1135:case")
  @TestData("switch (x) { case 1: let a, ) case 2: }", "TS1134:),TS1389:case")
  @TestData("class C { m() { switch (x) { case 1: public a } } }", "TS1129:public,TS1128:},TS1128:}")
  @TestMethod
  public endsTheListsItHoldsAtTheNextClause(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = () => { switch (x) { case 1: in; } };;) {}", "TS1129@80:2|TS1109@82:1|TS1128@84:1|TS1128@86:1|TS1128@89:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { switch (x) { case a in b: } };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { switch (a in b) {} };;) {}", "")
  @TestMethod
  public holdsTheInRestrictionThroughAClause(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("switch (x) { case : }", 17, "TS1109@18:1")
  @TestData("switch (x) { case /* gap */ : }", 17, "TS1109@28:1")
  @TestMethod
  public writesAMissingCaseExpressionAtTheEndOfTheKeyword(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptSwitchStatementNode);
    const clauseNode = statement.caseBlockNode.children[0];
    Assert.isInstanceOf(clauseNode, api.TypeScriptCaseClauseNode);
    Assert.isInstanceOf(clauseNode.expressionNode, api.TypeScriptMissingExpressionNode);
    Assert.areEqual(offset, clauseNode.expressionNode.span.startOffset);
    Assert.areEqual(0, clauseNode.expressionNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("switch (x) { case 1: )", "case 1: )")
  @TestData("switch (x) { case 1: f(); )", "case 1: f(); )")
  @TestData("switch (x) { default: )", "default: )")
  @TestMethod
  public endsAtATokenItsStatementListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(expected, parser.context.source.getText(node.caseBlockNode.children[0]!.span));
  }
}
