/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptForInOrOfStatementNode,
  TypeScriptForInStatementNode,
  TypeScriptForOfStatementNode,
  TypeScriptForStatementNode,
  TypeScriptOfKeywordNode,
  TypeScriptParser,
  TypeScriptUsingKeywordNode,
  TypeScriptVariableDeclarationListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ForStatementParserTests {
  @TestData("for(using value of resources){}", false, false, "")
  @TestData("for(await using value of resources){}", false, true, "")
  @TestData("for await(using value of resources){}", true, false, "TS1431")
  @TestData("for await(await using value of resources){}", true, true, "TS1431")
  @TestMethod
  public distinguishesAsyncIterationFromAsyncResourceDeclarations(
    content: string,
    isAsyncIteration: boolean,
    isAsyncDeclaration: boolean,
    expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const loop = result.rootNode.children[0];
    Assert.isInstanceOf(loop, TypeScriptForOfStatementNode);
    Assert.isInstanceOf(loop.initializerNode, TypeScriptVariableDeclarationListNode);
    Assert.isInstanceOf(loop.initializerNode.keywordNode, TypeScriptUsingKeywordNode);
    Assert.areEqual(isAsyncIteration, !Object.isUndefined(loop.awaitKeywordNode));
    Assert.areEqual(isAsyncDeclaration, !Object.isUndefined(loop.initializerNode.awaitKeywordNode));
    Assert.isInstanceOf(loop.ofKeywordNode, TypeScriptOfKeywordNode);
    if (isAsyncIteration && isAsyncDeclaration)
      Assert.isFalse(loop.awaitKeywordNode === loop.initializerNode.awaitKeywordNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("for(using value = resource; condition; step){}", "")
  @TestData("for(await using value = resource; condition; step){}", "")
  @TestData("for(using value in resources){}", "TS1493")
  @TestData("for(await using value in resources){}", "TS1494")
  @TestData("for(using {value} of resources){}", "TS1492")
  @TestData("for(using of = resource; ; ){}", "")
  @TestData("for(using of: T = resource; ; ){}", "")
  @TestData("for(using of; ; ){}", "TS1155")
  @TestData("for(var first, in values){}", "TS1009")
  @TestData("for(var first, ;;){}", "TS1009")
  @TestData("for(const [key,value] of entries){}", "")
  @TestMethod
  public retainsLoopDeclarationSyntaxForLaterLegalityChecks(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const loop = result.rootNode.children[0];
    Assert.isTrue(loop instanceof TypeScriptForStatementNode || loop instanceof TypeScriptForInOrOfStatementNode);
    Assert.isInstanceOf(loop.initializerNode, TypeScriptVariableDeclarationListNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("for (var a, b in x) {} for (var {a}, [b] of x) {} for (var a = 1, b in x) {}", "TS1091:b,TS1188:[,TS1091:b")
  @TestData("for (var a = 1 in x) {} for (let a = 1 of x) {} for (var [a] = 1 of x) {} for (using a = 1 of x) {}", "TS1189:a,TS1190:a,TS1190:[a],TS1190:a")
  @TestData("for (var a: number in x) {} for (var a: number of x) {} for (var a: T = 1 of x) {}", "TS2404:a,TS2483:a,TS1190:a")
  @TestData("for (async of x) {} for (\\u0061sync of x) {} for ((async) of x) {} for (async in x) {} async function f() { for (async of x) {} }", "TS1106:async,TS1106:\\u0061sync")
  @TestData("for (let in x) {}", "TS1123:")
  @TestData("for (var a, of x) {}", "TS1005:x,TS1005:),TS1005:")
  @TestData("declare namespace N { for (var a, b in x) {} for (var a, b in x) {} } declare namespace O { for (using a in b) {} }", "TS1036:for,TS1091:b,TS1036:for")
  @TestData("function g() { for await (var a, b of x) {} } async function h() { for await (var a = 1 of x) {} }", "TS1103:await,TS1190:a")
  @TestData("for await (var a, b of x) {}", "TS1431:await,TS1188:b")
  @TestData("declare namespace N { x; for (using a, b of y) {} for (var a, b of y) {} }", "TS1036:x,TS1545:using a, b,TS1188:b")
  @TestData("for await (var a, b of x) {} export {};", "TS1188:b")
  @TestData("function k() { for (await using a, b of x) {} } for (using a, b of x) {} class C { static { for await (var a, b of x) {} } }", "TS1188:b,TS18038:await,TS1188:b")
  @TestData("label: for (var a, b of x) {} for (const a of x) {} for (var a, b; ;) {} for (x in y) {} for (var of = 0 in of) { }", "TS1188:b,TS1189:of")
  @TestData("for (var [a] in x) {} for ({a} in x) {} for ([a] in x) {} for (const {a} in x) {} for (var [a], b in x) {}", "TS2491:[a],TS2491:{a},TS2491:[a],TS2491:{a},TS2491:[a],TS1091:b")
  @TestData("declare namespace N { for (var [a] in x) {} } for (f() in x) {} for (x?.y in z) {} for (f() of x) {} for (x?.y of z) {} for ((x) in y) {} for ([f()] of x) {}", "TS1036:for,TS2491:[a],TS2406:f(),TS2780:x?.y,TS2487:f(),TS2781:x?.y,TS2364:f()")
  @TestData("declare namespace N { for (using z of w) {} for (await using q = r; ;) {} for (using p in o) {} for (using s = t; ;) {} }", "TS1036:for,TS1546:await using q = r,TS1493:using p,TS1545:using s = t")
  @TestMethod
  public readsWhatAHeaderBindsWithInOrOf(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestMethod
  public recognizesUsingAsAnIterationTargetButRetainsAnAwaitedMissingDeclarationList(): void {
    const ordinary = TypeScriptParser.parse("for(using of resources){}");
    const awaited = TypeScriptParser.parse("for(await using of resources){}");
    const first = ordinary.rootNode.children[0];
    const second = awaited.rootNode.children[0];
    Assert.isInstanceOf(first, TypeScriptForOfStatementNode);
    Assert.isInstanceOf(first.initializerNode, TypeScriptUsingKeywordNode);
    Assert.isInstanceOf(second, TypeScriptForOfStatementNode);
    Assert.isInstanceOf(second.initializerNode, TypeScriptVariableDeclarationListNode);
    Assert.areEqual(0, second.initializerNode.children.length);
    Assert.isDefined(second.initializerNode.awaitKeywordNode);
    Assert.isInstanceOf(second.ofKeywordNode, TypeScriptOfKeywordNode);
    Assert.areEqual(0, ordinary.diagnostics.length);
    Assert.areEqual("TS1123", awaited.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("for await(using value in resources){}", "TS1005", 22, "'of' expected.")
  @TestData("for await(using value; ;){}", "TS1005", 21, "'of' expected.")
  @TestData("for await(;;){}", "TS1005", 10, "'of' expected.")
  @TestData("for(using value; ){}", "TS1005", 17, "';' expected.")
  @TestData("for(using value =; ;){}", "TS1109", 17, "Expression expected.")
  @TestData("for(using value of){}", "TS1109", 18, "Expression expected.")
  @TestMethod
  public reportsMissingLoopPartsWithoutConsumingTheirSeparators(content: string, code: string, start: number, text: string): void {
    const result = TypeScriptParser.parse(content);
    const loop = result.rootNode.children[0];
    Assert.isTrue(loop instanceof TypeScriptForStatementNode || loop instanceof TypeScriptForInOrOfStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(text, result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public distinguishesTheExpressionGrammarOfInAndOf(): void {
    const inResult = TypeScriptParser.parse("for(using value in first, second){}");
    const ofResult = TypeScriptParser.parse("for(using value of first, second){}");
    const parenthesized = TypeScriptParser.parse("for(using value of (first, second)){}");
    Assert.areEqual("TS1493", inResult.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual(0, parenthesized.diagnostics.length);
    Assert.areEqual(2, ofResult.diagnostics.length);
    Assert.areEqual("TS1005", ofResult.diagnostics[0]?.code.displayText);
    Assert.areEqual(24, ofResult.diagnostics[0]?.location?.start);
    Assert.areEqual("TS1005", ofResult.diagnostics[1]?.code.displayText);
    Assert.areEqual(32, ofResult.diagnostics[1]?.location?.start);
  }

  @TestMethod
  public parsesOrdinaryInOfAndAwaitForms(): void {
    const ordinaryParser = TypeScriptParserFixture.create("for (let index = 0; index < 10; index++) {}");
    const inParser = TypeScriptParserFixture.create("for (key in object) {}");
    const ofParser = TypeScriptParserFixture.create("for (const item of values) {}");
    const awaitParser = TypeScriptParserFixture.create("for await (const item of values) {}");
    const ordinaryNode = ordinaryParser.parseStatement();
    const inNode = inParser.parseStatement();
    const ofNode = ofParser.parseStatement();
    const awaitNode = awaitParser.parseStatement();

    Assert.isInstanceOf(ordinaryNode, TypeScriptForStatementNode);
    Assert.isInstanceOf(ordinaryNode.initializerNode, TypeScriptVariableDeclarationListNode);
    Assert.isDefined(ordinaryNode.firstSemicolonNode);
    Assert.isDefined(ordinaryNode.secondSemicolonNode);
    Assert.isInstanceOf(inNode, TypeScriptForInStatementNode);
    Assert.isInstanceOf(ofNode, TypeScriptForOfStatementNode);
    Assert.isUndefined(ofNode.awaitKeywordNode);
    Assert.isInstanceOf(awaitNode, TypeScriptForOfStatementNode);
    Assert.isDefined(awaitNode.awaitKeywordNode);
    Assert.areEqual(0, ordinaryParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, inParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, ofParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, awaitParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("for await (x in y) {}", "TS1005@13:2", "x in y")
  @TestData("for await (x; ;) {}", "TS1005@12:1", "x; ;")
  @TestMethod
  public keepsAnAwaitOnlyOnTheForOfItBegins(content: string, expected: string, expectedHeader: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isTrue(node instanceof TypeScriptForInStatementNode || node instanceof TypeScriptForStatementNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(expectedHeader, content.slice(node.openParenthesisNode!.span.endOffset, node.closeParenthesisNode!.span.startOffset));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public parsesInRestrictedCommaAndAssignmentInitializers(): void {
    const commaParser = TypeScriptParserFixture.create("for (first, second; condition; incrementor) {}");
    const assignmentParser = TypeScriptParserFixture.create("for (first = second = value; condition; incrementor) {}");
    const emptyParser = TypeScriptParserFixture.create("for (;;) {}");

    commaParser.parseStatement();
    assignmentParser.parseStatement();
    const emptyNode = emptyParser.parseStatement();

    Assert.areEqual(0, commaParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, assignmentParser.context.diagnosticCollector.diagnostics.length);
    Assert.isInstanceOf(emptyNode, TypeScriptForStatementNode);
    Assert.isUndefined(emptyNode.initializerNode);
    Assert.isUndefined(emptyNode.conditionNode);
    Assert.isUndefined(emptyNode.incrementorNode);
    Assert.areEqual(0, emptyParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("for initializer; condition; incrementor) {}", "TS1005@4:11 '(' expected.")
  @TestData("for (initializer condition; incrementor) {}", "TS1005@17:9 ';' expected.")
  @TestData("for (initializer; condition incrementor) {}", "TS1005@28:11 ';' expected.")
  @TestData("for (initializer; condition; incrementor {}", "TS1005@41:1 ')' expected.")
  @TestMethod
  public reportsMissingHeaderDelimiters(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptForStatementNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("for (var x = delete 1 in o) {}", "TS1189:x")
  @TestData("for (var [x] = [delete 1] in o) {}", "TS1189:[x],TS2491:[x],TS2703:1")
  @TestMethod
  public checksAForInDeclarationsInitializerOnlyThroughAPattern(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = () => { for (a in b;;) {} };;) {}", "TS1005@70:1|TS1128@72:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { for (;a in b;) {} };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { for (var c of a in b) {} };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { for (const c of a in b) {} };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { for (;; a in b) {} };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => { for (a in a in b) {} };;) {}", "")
  @TestMethod
  public readsInAsAnOperatorAfterTheInitializer(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
