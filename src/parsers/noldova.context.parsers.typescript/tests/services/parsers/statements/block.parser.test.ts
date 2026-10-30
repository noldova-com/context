/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBlockNode,
  TypeScriptCloseBraceNode,
  TypeScriptEmptyStatementNode,
  TypeScriptExpressionStatementNode,
  TypeScriptOpenBraceNode,
  TypeScriptParser,
  TypeScriptTryStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class BlockParserTests {
  @TestData("{}=value;", 2)
  @TestData("{run();} = value;", 9)
  @TestMethod
  public diagnosesAndConsumesAnEqualsSignAfterAStatementBlock(content: string, start: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptBlockNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS2809", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public appliesBlockRecoveryInsideAFunctionExpressionButNotToObjectLiterals(): void {
    const functionResult = TypeScriptParser.parse("void (function(){} = rhs);");
    Assert.areEqual(3, functionResult.diagnostics.length);
    Assert.areEqual("TS2809", functionResult.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1005", functionResult.diagnostics[1]?.code.displayText);
    Assert.areEqual("TS1128", functionResult.diagnostics[2]?.code.displayText);
    Assert.areEqual(0, TypeScriptParser.parse("const x = {} = value;").diagnostics.length);
  }

  @TestData(")")
  @TestData("]")
  @TestData(":")
  @TestData(",")
  @TestData("case")
  @TestData("default")
  @TestMethod
  public skipsUnexpectedTokensWithoutAnEnclosingSwitchClause(token: string): void {
    const result = TypeScriptParser.parse("{ " + token + " value; }");
    const block = result.rootNode.children[0];
    Assert.isInstanceOf(block, TypeScriptBlockNode);
    Assert.isDefined(block.closeBraceNode);
    Assert.areEqual(1, block.children.length);
    Assert.isInstanceOf(block.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1128", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(2, result.diagnostics[0]?.location?.start);
    Assert.areEqual(token.length, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public distinguishesRequiredBlockRecoveryFromOrdinaryBlockParsing(): void {
    const missing = TypeScriptParser.parse("try finally {}");
    const node = missing.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptTryStatementNode);
    Assert.isUndefined(node.tryBlockNode.openBraceNode);
    Assert.isUndefined(node.tryBlockNode.closeBraceNode);
    Assert.areEqual(0, node.tryBlockNode.children.length);
    Assert.areEqual(3, node.tryBlockNode.span.startOffset);
    Assert.areEqual(0, node.tryBlockNode.span.length);
    Assert.isDefined(node.finallyBlockNode?.openBraceNode);
    Assert.areEqual(1, missing.diagnostics.length);
    Assert.areEqual("'{' expected.", missing.diagnostics[0]?.message.text);
    const incomplete = TypeScriptParser.parse("try {");
    Assert.areEqual(1, incomplete.diagnostics[0]?.relatedInformation.length);
  }

  @TestMethod
  public skipsRejectedCharactersWithoutInventingAStatementOrConsumingTheCloser(): void {
    const parser = TypeScriptParserFixture.create("{§}");
    const block = parser.parseStatement();

    Assert.isInstanceOf(block, TypeScriptBlockNode);
    Assert.areEqual(0, block.children.length);
    Assert.isDefined(block.closeBraceNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1127", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics[0]?.location?.start);
  }

  @TestMethod
  public preservesBoundaryTriviaOnARecoveredBlock(): void {
    const result = TypeScriptParser.parse(" {value; ");
    const block = result.rootNode.children[0];

    Assert.isInstanceOf(block, TypeScriptBlockNode);
    Assert.isDefined(block.leadingTrivia);
    Assert.isDefined(block.trailingTrivia);
  }

  @TestMethod
  public parsesNestedStatements(): void {
    const sourceText = "{value;{;nested;}}";
    const result = TypeScriptParser.parse(sourceText);
    const block = result.rootNode.children[0];

    Assert.isInstanceOf(block, TypeScriptBlockNode);
    Assert.isInstanceOf(block.openBraceNode, TypeScriptOpenBraceNode);
    Assert.isInstanceOf(block.closeBraceNode, TypeScriptCloseBraceNode);
    Assert.areEqual(2, block.children.length);
    Assert.isInstanceOf(block.children[0], TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(block.children[1], TypeScriptBlockNode);
    const nestedBlock = block.children[1];
    Assert.areEqual(2, nestedBlock.children.length);
    Assert.isInstanceOf(nestedBlock.children[0], TypeScriptEmptyStatementNode);
    Assert.isInstanceOf(nestedBlock.children[1], TypeScriptExpressionStatementNode);
    Assert.areEqual(sourceText.length, block.span.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public reportsAMissingClosingBrace(): void {
    const sourceText = "{value;";
    const result = TypeScriptParser.parse(sourceText);
    const block = result.rootNode.children[0];

    Assert.isInstanceOf(block, TypeScriptBlockNode);
    Assert.isUndefined(block.closeBraceNode);
    Assert.areEqual(sourceText.length, block.span.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("'}' expected.", result.diagnostics[0]?.message.text);
    Assert.areEqual(sourceText.length, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
  }

  @TestData("class C{ m(){ public n(){} }", "TS1128@14:6 Declaration or statement expected.")
  @TestData("function f(){ public x; static y; }", "TS1128@14:6 Declaration or statement expected.|TS1128@24:6 Declaration or statement expected.")
  @TestMethod
  public refusesClassMemberModifiersInABlock(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("f(() => { ) });", "TS1128:),TS1128:},TS1128:)")
  @TestData("f(function () { ) });", "TS1128:),TS1128:},TS1128:)")
  @TestData("switch (x) { case 1: { ) case 2: }", "TS1128:),TS1128:case")
  @TestMethod
  public leavesATokenAnEnclosingListReads(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = function () { a in b; };;) {}", "TS1434@65:1|TS1128@67:2|TS1005@71:1|TS1128@73:1|TS1128@76:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { a in b; };;) {}", "TS1434@59:1|TS1128@61:2|TS1005@65:1|TS1128@67:1|TS1128@70:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = function () { return a in b; };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = function () { var c = a in b; };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = function () { a in b };;) {}", "TS1434@65:1|TS1128@67:2|TS1005@72:1|TS1128@75:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { l: a in b; };;) {}", "TS1434@62:1|TS1128@64:2|TS1005@68:1|TS1128@70:1|TS1128@73:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { class C { m() { a in b; } } };;) {}", "TS1434@75:1|TS1128@77:2|TS1005@87:1|TS1128@90:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { export default a in b; };;) {}", "TS1005@76:2|TS1005@80:1|TS1128@82:1|TS1128@85:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = function () { a in b; } in x) {}", "TS1434@65:1|TS1128@67:2|TS1005@71:1|TS1128@73:1|TS1109@75:2|TS1005@79:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { a in b; } in x) {}", "TS1434@59:1|TS1128@61:2|TS1005@65:1|TS1128@67:1|TS1109@69:2|TS1005@73:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = { get m() { a in b; return 1; } };;) {}", "TS1434@63:1|TS1128@65:2|TS1005@69:1|TS1005@78:1|TS1005@79:1|TS1005@83:1|TS1128@86:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = { m() { a in b; } };;) {}", "TS1434@59:1|TS1128@61:2|TS1005@65:1|TS1005@69:1|TS1128@72:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = class { m() { a in b; } };;) {}", "TS1434@65:1|TS1128@67:2|TS1005@75:1|TS1128@78:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = async function () { await a in b; };;) {}", "TS1005@79:2|TS1005@83:1|TS1128@85:1|TS1128@88:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = function* () { yield a in b; };;) {}", "TS1005@74:2|TS1005@78:1|TS1128@80:1|TS1128@83:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { in x; };;) {}", "TS1128@59:2|TS1005@63:1|TS1128@65:1|TS1128@68:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { return; in x; };;) {}", "TS1128@67:2|TS1005@71:1|TS1128@73:1|TS1128@76:1")
  @TestData("declare const x: any; in x;", "TS1109@22:2")
  @TestData("declare const x: any; function f() { in x; }", "TS1109@37:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { case 1: in x; };;) {}", "TS1128@59:4|TS1005@65:1|TS1128@67:2|TS1005@71:1|TS1128@73:1|TS1128@76:1")
  @TestMethod
  public holdsTheInRestrictionThroughAFunctionBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("f(function () { await; }, a if (b) c);\nexport {};", "TS1005@28:2|TS1434@35:1|TS1128@36:1")
  @TestData("f(() => { await; }, a if (b) c);\nexport {};", "TS1005@22:2|TS1434@29:1|TS1128@30:1")
  @TestData("f(function* () { await; }, a if (b) c);\nexport {};", "TS1005@29:2|TS1434@36:1|TS1128@37:1")
  @TestData("f({ m() { await; } }, a if (b) c);\nexport {};", "TS1005@24:2|TS1434@31:1|TS1128@32:1")
  @TestData("f({ get x() { return await; } }, a if (b) c);\nexport {};", "TS1005@35:2|TS1434@42:1|TS1128@43:1")
  @TestData("let f = function (a = await) { g(a if (b) c) };\nexport {};", "TS1005@35:2|TS1434@42:1|TS1128@43:1")
  @TestMethod
  public forgetsTheAwaitNamesAFunctionBodyReads(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("{ x;", "TS1005@4:0{The parser expected to find a '}' to match the '{' token here.@0}")
  @TestData("function f() { x;", "TS1005@17:0{The parser expected to find a '}' to match the '{' token here.@13}")
  @TestData("class C { m() { x;", "TS1005@18:0{The parser expected to find a '}' to match the '{' token here.@14}")
  @TestData("switch (x) { case 1:", "TS1005@20:0")
  @TestMethod
  public namesTheOpenBraceAMissingCloseWouldMatch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(result.diagnostics));
  }

  @TestMethod
  public endsABlockWithoutItsClosingBraceAtItsLastWrittenToken(): void {
    const result = TypeScriptParser.parse("{ a;  ");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptBlockNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(4, node.span.endOffset);
    Assert.areEqual("TS1005@6:0", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
