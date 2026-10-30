/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptArrowFunctionNode,
  TypeScriptAsyncKeywordNode,
  TypeScriptBlockNode,
  TypeScriptConditionalExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptParameterNode,
  TypeScriptParenthesizedExpressionNode,
  TypeScriptParser,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";
import { TypeScriptSyntaxParserProbe } from "../../../fixtures/typescript-syntax-parser-probe.js";

@TestClass
export class ArrowFunctionParserTests {
  @TestData("<any>((n) => [n]);")
  @TestData("<any>((n) => {return n;});")
  @TestData("<P>({add:function(x){return x;}})")
  @TestData("async function f(){(async()=>{});}")
  @TestData("async function f(){(value: T) => value;}")
  @TestMethod
  public rejectsRecoveredParameterCandidatesWithoutRejectingTheActualExpression(content: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.endOffset);
  }

  @TestData("c ? (x: A): T => x;", "TS1005@18:1")
  @TestData("c ? async (): T => v;", "TS1005@20:1")
  @TestMethod
  public keepsADefiniteArrowInAConditionalsTrueBranch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptConditionalExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.trueExpressionNode, TypeScriptArrowFunctionNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public retainsAnExplicitArrowWithAMalformedParameterType(): void {
    const result = TypeScriptParser.parse("const f=<T>(x:) =>x");
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1110", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(14, result.diagnostics[0]?.location?.start);
  }

  @TestMethod
  public parsesEveryArrowSignatureForm(): void {
    const singleNode = TypeScriptParserFixture.create("value => value").parseExpression();
    const asyncSingleNode = TypeScriptParserFixture.create("async value => value").parseExpression();
    const parenthesizedNode = TypeScriptParserFixture.create("(value: Value): Result => value").parseExpression();
    const genericNode = TypeScriptParserFixture.create("async <Value>(value: Value) => {}").parseExpression();
    const asyncParameterNode = TypeScriptParserFixture.create("async => async").parseExpression();

    Assert.isInstanceOf(singleNode, TypeScriptArrowFunctionNode);
    Assert.isDefined(singleNode.parameterNode);
    Assert.isInstanceOf(asyncSingleNode, TypeScriptArrowFunctionNode);
    Assert.isDefined(asyncSingleNode.modifierNodes[0]);
    Assert.isInstanceOf(parenthesizedNode, TypeScriptArrowFunctionNode);
    Assert.isDefined(parenthesizedNode.parameterListNode);
    Assert.isDefined(parenthesizedNode.returnTypeNode);
    Assert.isInstanceOf(genericNode, TypeScriptArrowFunctionNode);
    Assert.isInstanceOf(genericNode.bodyNode, TypeScriptBlockNode);
    Assert.isInstanceOf(asyncParameterNode, TypeScriptArrowFunctionNode);
    Assert.isUndefined(asyncParameterNode.modifierNodes[0]);
  }

  @TestMethod
  public respectsTheLineBreakAfterAsync(): void {
    const parser = TypeScriptParserFixture.create("async\nvalue => value");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptAsyncKeywordNode);
  }

  @TestData("() => value")
  @TestData("(value?) => value")
  @TestData("(value?, other?) => value")
  @TestData("([value]?: Value) => value")
  @TestData("({ value }?: Value) => value")
  @TestData("(this: Value) => value")
  @TestData("(value = (other = initial)) => value")
  @TestData("(value = condition ? first : second) => value")
  @TestData("({ value = initial, nested: [first, , ...rest] } = source) => value")
  @TestData("([value = initial, , ...rest] = source) => value")
  @TestData("async () => value")
  @TestData("async (...values) => values")
  @TestData("async (of) => of")
  @TestData("async ([value]) => value")
  @TestData("async ({value}) => value")
  @TestData("of => of")
  @TestData("(value = call()) => value")
  @TestData("([value]: Value) => value")
  @TestData("({ value }: Value) => value")
  @TestData("<Value extends Outer<Inner>>(value: Value) => value")
  @TestData("<Value extends Factory<<Inner>() => Inner>>(value: Value) => value")
  @TestData("(value): (() => Result) => value")
  @TestData("(value): Result[] => value")
  @TestData("(value): { value: Result } => value")
  @TestData("(value): Outer<Inner> => value")
  @TestData("(value): Factory<<Inner>() => Inner> => value")
  @TestMethod
  public recognizesBoundedArrowSignatures(value: string): void {
    const node = TypeScriptParserFixture.create(value).parseExpression();

    Assert.isInstanceOf(node, TypeScriptArrowFunctionNode);
  }

  @TestData("(value? = initial) => value", "TS1015")
  @TestData("(value?, other) => value", "TS1016")
  @TestData("(...values,) => values", "TS1013")
  @TestMethod
  public retainsParameterDiagnosticsAfterChoosingTheArrow(content: string, diagnosticCode: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();
    const nodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);

    Assert.isInstanceOf(node, TypeScriptArrowFunctionNode);
    Assert.areEqual(1, nodeGrammarDiagnostics.length);
    Assert.areEqual(diagnosticCode, nodeGrammarDiagnostics[0]?.code.displayText);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("async (value")
  @TestData("async (42)")
  @TestMethod
  public rejectsAnIncompleteOrNonParameterAsyncCallAsAnArrow(content: string): void {
    const node = TypeScriptParserFixture.create(content).parseExpression();

    Assert.isFalse(node instanceof TypeScriptArrowFunctionNode);
  }

  @TestData("(value = /[)]/) => value", "/[)]/")
  @TestData("(value = /[}]/) => value", "/[}]/")
  @TestData("(value = `plain)`) => value", "`plain)`")
  @TestData("(value = `x${call()})`) => value", "`x${call()})`")
  @TestMethod
  public preservesInitializerBoundariesInArrowSignatures(content: string, initializerText: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptArrowFunctionNode);
    Assert.isDefined(node.parameterListNode);
    Assert.areEqual(1, node.parameterListNode.children.length);
    Assert.isDefined(node.parameterListNode.closeParenthesisNode);
    const parameterNode = node.parameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);
    Assert.isDefined(parameterNode.initializerNode);
    const initializerSpan = parameterNode.initializerNode.span;
    Assert.areEqual(initializerText, content.slice(initializerSpan.startOffset, initializerSpan.endOffset));
    Assert.isInstanceOf(node.bodyNode, TypeScriptIdentifierNode);
    Assert.areEqual("value", node.bodyNode.value);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("const f = (a b) => c;", "TS1005@13:1|TS1005@14:1|TS1005@16:2")
  @TestData("const f = <T U>(x)=>x;", "TS1005@13:1")
  @TestData("const f = (a = {) => b;", "TS1136@16:1")
  @TestData("const f = <<T>() => T>value;", "TS1109@10:2|TS1109@15:1|TS1005@17:2")
  @TestMethod
  public returnsDiagnosticsAndContinuesAfterMalformedSignatures(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content + " const recovered = 1;");

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    const statementNode = result.rootNode.children.at(-1);
    Assert.isInstanceOf(statementNode, TypeScriptVariableStatementNode);
    const declarationNode = statementNode.declarationListNode.children[0];
    Assert.isInstanceOf(declarationNode, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declarationNode.nameNode, TypeScriptIdentifierNode);
    Assert.areEqual("recovered", declarationNode.nameNode.value);
  }

  @TestData("<Value")
  @TestData("<Value>(value")
  @TestData("(value")
  @TestData("(value): Result")
  @TestData("(42)")
  @TestMethod
  public rejectsIncompleteAndNonArrowPrefixes(value: string): void {
    const node = TypeScriptParserFixture.create(value).parseExpression();

    Assert.isFalse(node instanceof TypeScriptArrowFunctionNode);
  }

  @TestData(10)
  @TestData(20)
  @TestData(40)
  @TestData(80)
  @TestData(160)
  @TestMethod
  public boundsWorkForDeeplyNestedNonArrowParentheses(depth: number): void {
    const parser = new TypeScriptSyntaxParserProbe("(".repeat(depth) + "identifier" + ")".repeat(depth));
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptParenthesizedExpressionNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.advanceCount <= depth * 4 + 4);
  }

  @TestData("condition ? value => ({ value }) : other => ({ other })")
  @TestData("a ? (b) : c => (d) : e => f")
  @TestData("condition ? (value): T => value : fallback")
  @TestData("condition ? async (value) => { return value; } : fallback")
  @TestMethod
  public leavesTheConditionalColonWithItsOwningExpression(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptConditionalExpressionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("<T>(p: T) => { return p; }")
  @TestData("async <T>(p: T) => { return p; }")
  @TestMethod
  public scopesBothAsyncAndOrdinaryGenericArrowBlocks(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.isInstanceOf(parser.parseExpression(), TypeScriptArrowFunctionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("type T = function(x: T): U;", "TS1005@17:1|TS1005@26:1", 2)
  @TestData("type T = function(T): U;", "TS1005@17:1|TS1005@20:1", 3)
  @TestData("(value): Result", "TS1005@7:1", 2)
  @TestData("(value:T): Result;", "TS1005@17:1", 1)
  @TestData("(): Result;", "TS1005@10:1", 1)
  @TestData("(value) {}", "TS1005@8:1", 1)
  @TestData("async(value) {}", "TS1005@13:1", 1)
  @TestData("async (value: T) {}", "TS1005@17:1", 1)
  @TestData("(value) => value;", "", 1)
  @TestData("(value = initial);", "", 1)
  @TestData("const f = <T>(value: T): T;", "TS1005@19:1|TS1005@22:1|TS1134@23:1", 1)
  @TestData("const f = <T>(value: T) { return value; };", "TS1005@24:1", 1)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestData("const f = () => var x=1; };", "TS1005@16:3 '{' expected.")
  @TestData("const f = () => return x; };", "TS1005@16:6 '{' expected.")
  @TestData("async()=>return x;}", "TS1005@9:6 '{' expected.")
  @TestData("const f = () => function() {};", "")
  @TestData("const f = () => class {};", "")
  @TestData("(x:T) value", "TS1005@6:5 '=>' expected.")
  @TestMethod
  public requiresBracesAroundAStatementBodyAndAnArrowAfterAHead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("const f = <>(a) => a;", "TS1110,TS1005")
  @TestData("const f = <>() => 1;", "TS1110,TS1109,TS1005")
  @TestData("const f = async <>(a) => a;", "TS1005")
  @TestData("const f = <Type>(a) => a;", "")
  @TestData("const f = <Type,>(a) => a;", "")
  @TestMethod
  public readsAnEmptyTypeParameterListAsATypeAssertion(content: string, expectedCodes: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedCodes, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("var f1 = ()\n=> 1;", "TS1200:=>")
  @TestData("var f2 = x\n=> 1;", "TS1200:=>")
  @TestData("var f3 = async (a)\n=> 1;", "TS1200:=>")
  @TestData("var f4 = <T,>(a)\n=> 1;", "TS1200:=>")
  @TestData("var f5 = (a) =>\n1;", "")
  @TestData("var f6 = (a?, b)\n=> 1;", "TS1016:b")
  @TestData("var f8 = (a) /* c\n */ => 1;", "TS1200:=>")
  @TestData("var f9 = (a): a is T\n=> true;", "TS1200:=>")
  @TestData("var f10 = (this: T)\n=> 1;", "TS2730:this: T,TS1200:=>")
  @TestData("f((a,\nb)\n=> 1);", "TS1200:=>")
  @TestData("var l = (x): y is T => true; var n = (...x): x is T => true; var o = ([a]): a is T => true;", "TS1225:y,TS1229:x,TS1230:a")
  @TestMethod
  public readsTheLineBeforeTheArrowAndAPredicateAgainstTheHead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("const a = <in T>() => 1;", "TS1005@14:1|TS1109@17:1|TS1005@19:2")
  @TestData("const a = <in T,>() => 1;", "TS1005@14:1|TS1134@16:1|TS1109@18:1|TS1005@20:2")
  @TestData("const a = <in out T>(x: T) => x;", "TS1005@14:3|TS1005@18:1|TS1005@19:1|TS1005@22:1|TS1434@24:1|TS1128@25:1|TS1128@27:2")
  @TestData("const a = async <in T>() => 1;", "TS1109@17:2|TS1109@23:1|TS1005@25:2")
  @TestData("const a = <out T>() => 1;", "TS1274@11:3")
  @TestData("const a = <const T>() => 1;", "")
  @TestData("const a = <T>() => 1;", "")
  @TestData("const a = << T>() => 1;", "TS1109@10:2|TS1109@16:1|TS1005@18:2")
  @TestData("const a = <yield T>() => 1;", "TS1005@17:1")
  @TestData("function* g() { const a = <yield>() => 1; }", "TS1109@34:1|TS1005@36:2")
  @TestData("async function g() { const a = <await>() => 1; }", "TS1109@39:1|TS1005@41:2")
  @TestData("const a = <this>() => 1;", "TS1109@17:1|TS1005@19:2")
  @TestData("const a = <in>() => 1;", "TS1109@15:1|TS1005@17:2")
  @TestData("const a = <const>() => 1;", "TS1359@11:5")
  @TestData("const a = <public T>() => 1;", "TS1273@11:6")
  @TestData("const a = <in T>(x);", "TS1005@14:1")
  @TestData("const a = <in T>x;", "TS1005@14:1")
  @TestData("const a = <in T>(x) => x;", "TS1005@14:1|TS1005@20:2")
  @TestData("let x = async <in T>(y) => y;", "TS1109@15:2|TS1005@24:2")
  @TestData("let x = async <T>(y) => y;", "")
  @TestData("let x = async <const T>(y) => y;", "")
  @TestData("let x = async <in T>y;", "TS1109@15:2")
  @TestData("let x = f(<in T>() => 1);", "TS1005@14:1|TS1109@17:1|TS1005@19:2|TS1005@23:1")
  @TestData("let x = <in T>() => 1, y = 2;", "TS1005@12:1|TS1109@15:1|TS1005@17:2")
  @TestMethod
  public readsATypeParameterListAsAHeadOnlyAfterANameOrConst(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("declare const x: any; for (var k = () => 1 in x) {}", "TS1189@31:1")
  @TestData("declare const x: any; for (var k = <T>() => 1 in x) {}", "TS1189@31:1")
  @TestData("declare const x: any; for (var k = (a) => a in x) {}", "TS1189@31:1")
  @TestData("declare const x: any; for (var k = a => a in x) {}", "TS1189@31:1")
  @TestData("declare const x: any; for (var k = async () => 1 in x) {}", "TS1189@31:1")
  @TestData("declare const x: any; for (let k = () => 1 in x) {}", "TS1189@31:1")
  @TestData("declare const x: any; for (() => 1 in x;;) {}", "TS1005@39:1|TS1128@41:1")
  @TestData("declare const x: any; for (var k = () => 1 in x;;) {}", "TS1005@47:1|TS1128@49:1")
  @TestData("declare const x: any, a: any; for (a => a in x;;) {}", "TS1005@46:1|TS1128@48:1")
  @TestData("declare const x: any; for (async () => 1 in x;;) {}", "TS1005@45:1|TS1128@47:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = (a, b) => a in x;;) {}", "TS1005@67:1|TS1128@69:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = (a: any) => a in x;;) {}", "TS1005@69:1|TS1128@71:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = () => () => 1 in x) {}", "TS1189@47:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = async (a) in x) {}", "TS1189@47:1")
  @TestMethod
  public holdsTheInRestrictionThroughABodyWithoutBraces(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("x = => 1;", "TS1005@4:2 '(' expected.")
  @TestData("let v = => 1;", "TS1005@8:2 '(' expected.")
  @TestData("if (x) => 1;", "TS1005@7:2 '(' expected.")
  @TestData("a ? => 1 : 2;", "TS1005@4:2 '(' expected.")
  @TestData("x = => { y; };", "TS1005@4:2 '(' expected.")
  @TestData("x = =>;", "TS1005@4:2 '(' expected.|TS1109@6:1 Expression expected.")
  @TestData("x = a => => 1;", "TS1005@9:2 '(' expected.")
  @TestData("x = (=> 1);", "TS1005@5:2 '(' expected.")
  @TestData("(a, if) => 1;", "TS1109@4:2 Expression expected.|TS1005@6:1 '(' expected.|TS1005@8:2 '(' expected.")
  @TestData("(await = await) => 1;\nexport {};", "TS1109@7:1 Expression expected.|TS1109@14:1 Expression expected.|TS1005@16:2 '(' expected.")
  @TestData("=> 1;", "TS1128@0:2 Declaration or statement expected.")
  @TestData("f(=> 1);", "TS1135@2:2 Argument expression expected.")
  @TestMethod
  public readsAStandaloneArrowAsAnArrowWhoseHeadIsMissing(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
