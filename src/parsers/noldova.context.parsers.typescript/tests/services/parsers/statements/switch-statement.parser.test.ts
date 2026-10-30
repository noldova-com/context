/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import * as api from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class SwitchStatementParserTests {
  @TestMethod
  public preservesRecoverySpansInsideABoundedSourceAndAcrossRollback(): void {
    const content = " /* lead */ switch(x){case 1: { run(); default: }";
    const reader = new SourceReader(new Source("<html>" + content + "</html>"), new SourceSpan(6, content.length));
    const result = new api.TypeScriptParser(reader).parse();
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, api.TypeScriptSwitchStatementNode);
    Assert.isDefined(statement.leadingTrivia);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(6 + content.indexOf("default"), result.diagnostics[0]?.location?.start);
    Assert.areEqual(7, result.diagnostics[0]?.location?.length);
    Assert.areEqual(6 + content.length, reader.currentOffset);

    const parser = TypeScriptParserFixture.create(content);
    const original = parser.currentNode;
    const rootArrows = parser.context.getRejectedArrowOffsets(parser.context.contextFlags);
    parser.lookAhead(() => { parser.parseStatement(); return true; });
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(rootArrows, parser.context.getRejectedArrowOffsets(parser.context.contextFlags));
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(rootArrows, parser.context.getRejectedArrowOffsets(parser.context.contextFlags));
    parser.parseStatement();
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public recoversStrayCaseTokensInTheEnclosingSourceList(): void {
    const result = api.TypeScriptParser.parse("switch(x){ foo(); case 1: break;}");
    Assert.areEqual(4, result.rootNode.children.length);
    Assert.areEqual(4, result.diagnostics.length);
    Assert.areEqual("TS1130", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(11, result.diagnostics[0]?.location?.start);
    Assert.areEqual("TS1128", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(18, result.diagnostics[1]?.location?.start);
    Assert.areEqual("TS1005", result.diagnostics[2]?.code.displayText);
    Assert.areEqual(24, result.diagnostics[2]?.location?.start);
    Assert.areEqual("TS1128", result.diagnostics[3]?.code.displayText);
    Assert.areEqual(32, result.diagnostics[3]?.location?.start);
    Assert.isInstanceOf(result.rootNode.children[1], api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(result.rootNode.children[3], api.TypeScriptBreakStatementNode);
  }

  @TestMethod
  public returnsAnEnclosingDefaultClauseToItsSwitchInsteadOfConsumingItAsAnExpression(): void {
    const content = "switch(x){case 1: { run(); default: }";
    const result = api.TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(2, statement.caseBlockNode.children.length);
    const first = statement.caseBlockNode.children[0];
    Assert.isInstanceOf(first, api.TypeScriptCaseClauseNode);
    const innerBlock = first.children[0];
    Assert.isInstanceOf(innerBlock, api.TypeScriptBlockNode);
    Assert.isUndefined(innerBlock.closeBraceNode);
    Assert.areEqual(26, innerBlock.span.endOffset);
    Assert.isInstanceOf(statement.caseBlockNode.children[1], api.TypeScriptDefaultClauseNode);
    Assert.isDefined(statement.caseBlockNode.closeBraceNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1128", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(27, result.diagnostics[0]?.location?.start);
    Assert.areEqual(7, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public preservesOrderedClausesAndWrittenDelimiters(): void {
    const result = api.TypeScriptParser.parse("switch (x) { case 1: run(); break; case 2: default: stop(); }");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.isInstanceOf(node.expressionNode, api.TypeScriptIdentifierNode);
    Assert.isDefined(node.openParenthesisNode);
    Assert.isDefined(node.closeParenthesisNode);
    Assert.isDefined(node.caseBlockNode.openBraceNode);
    Assert.isDefined(node.caseBlockNode.closeBraceNode);
    Assert.areEqual(3, node.caseBlockNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("switch () {}", 8, "TS1109@8:1")
  @TestData("switch ) {}", 6, "TS1005@7:1")
  @TestMethod
  public writesAMissingExpressionWhereTheSourceLacksOne(content: string, offset: number, expected: string): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.isInstanceOf(node.expressionNode, api.TypeScriptMissingExpressionNode);
    Assert.areEqual(offset, node.expressionNode.span.startOffset);
    Assert.areEqual(0, node.expressionNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("switch () {}", "TS1109", 8)
  @TestData("switch x) {}", "TS1005", 7)
  @TestData("switch (x {}", "TS1005", 10)
  @TestData("switch(x)", "TS1005", 9)
  @TestData("switch(x){", "TS1005", 10)
  @TestMethod
  public recoversMissingHeaderAndBlockTokens(content: string, code: string, start: number): void {
    const result = api.TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], api.TypeScriptSwitchStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
  }

  @TestMethod
  public skipsInvalidCharactersBeforeClausesWithoutLosingTheBlock(): void {
    const result = api.TypeScriptParser.parse("switch(x){§ case 1: break;}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(1, node.caseBlockNode.children.length);
    Assert.isDefined(node.caseBlockNode.closeBraceNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1127", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public leavesAnUnexpectedStatementForTheEnclosingList(): void {
    const result = api.TypeScriptParser.parse("switch(x){ run();");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(0, node.caseBlockNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[1], api.TypeScriptExpressionStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1130", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public supportsNestedSwitchesAndInExpressions(): void {
    const result = api.TypeScriptParser.parse("switch(x in values){case y in values: switch(y){default: break;} default: break;}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    const first = node.caseBlockNode.children[0];
    Assert.isInstanceOf(first, api.TypeScriptCaseClauseNode);
    Assert.isInstanceOf(first.children[0], api.TypeScriptSwitchStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public preservesBoundedCoordinatesTriviaAndRollback(): void {
    const content = " /* leading */ switch(x){case 1: break;} /* trailing */ ";
    const reader = new SourceReader(new Source("<x>" + content + "</x>"), new SourceSpan(3, content.length));
    const result = new api.TypeScriptParser(reader).parse();
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(18, node.span.startOffset);
    Assert.isDefined(node.leadingTrivia);
    Assert.isDefined(result.rootNode.trailingTrivia);
    Assert.areEqual(3 + content.length, reader.currentOffset);
    const parser = TypeScriptParserFixture.create("switch(x){case : break;} next;");
    const initial = parser.currentNode;
    parser.lookAhead(() => { parser.parseStatement(); return true; });
    Assert.areEqual(initial, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(initial, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isInstanceOf(parser.parseStatement(), api.TypeScriptSwitchStatementNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public writesAnEmptyCaseBlockAtTheEndOfTheHeaderWhereItsOpeningBraceIsMissing(): void {
    const result = api.TypeScriptParser.parse("switch (x)  run();");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptSwitchStatementNode);
    Assert.isUndefined(statement.caseBlockNode.openBraceNode);
    Assert.areEqual(10, statement.caseBlockNode.span.startOffset);
    Assert.areEqual(0, statement.caseBlockNode.span.length);
    Assert.isUndefined(statement.caseBlockNode.leadingTrivia);
    Assert.areEqual(10, statement.span.endOffset);
  }

  @TestData("switch (x)  ;", ";")
  @TestData("switch (x) { ;", "{ ;")
  @TestMethod
  public endsItsCaseBlockAtATokenTheBlockSkipped(content: string, expected: string): void {
    const result = api.TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(expected, content.slice(statement.caseBlockNode.span.startOffset, statement.caseBlockNode.span.endOffset));
    Assert.areEqual(content.length, statement.span.endOffset);
  }

  @TestData("switch (x)  ;", 0, "TS1005@12:1|TS1005@13:0")
  @TestData("switch (x) ;", 0, "TS1005@11:1|TS1005@12:0")
  @TestData("switch (x) ; case 1: }", 1, "TS1005@11:1")
  @TestData("switch (x) { ; case 1: }", 1, "TS1130@13:1")
  @TestMethod
  public skipsATokenNoEnclosingListReads(content: string, clauseCount: number, expected: string): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, api.TypeScriptSwitchStatementNode);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(clauseCount, node.caseBlockNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
