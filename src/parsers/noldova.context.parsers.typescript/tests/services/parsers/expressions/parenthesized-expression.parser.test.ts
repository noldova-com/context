/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptCallExpressionNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParenthesizedExpressionNode,
  TypeScriptParser,
  TypeScriptPostfixUnaryExpressionNode,
  TypeScriptPropertyAccessExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ParenthesizedExpressionParserTests {
  @TestMethod
  public preservesThePrecedenceOfSuffixesAndBinaryOperators(): void {
    const parser = TypeScriptParserFixture.create("(fn = source)(argument).value++ + other * last");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.leftNode, TypeScriptPostfixUnaryExpressionNode);
    Assert.isInstanceOf(node.leftNode.operandNode, TypeScriptPropertyAccessExpressionNode);
    Assert.isInstanceOf(node.leftNode.operandNode.expressionNode, TypeScriptCallExpressionNode);
    const callNode = node.leftNode.operandNode.expressionNode;
    Assert.isInstanceOf(callNode.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(callNode.expressionNode.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.rightNode, TypeScriptBinaryExpressionNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("async()")
  @TestData("async(value)")
  @TestData("async(value,)")
  @TestData("async(value = /[)]/, other = `value${call()})`)")
  @TestData("async\n(value)")
  @TestMethod
  public preservesCallsToAsyncAsAnOrdinaryName(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isDefined(node.argumentListNode.closeParenthesisNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("async(", "TS1005@6:0 ')' expected.")
  @TestData("async(value,", "TS1005@12:0 ')' expected.")
  @TestMethod
  public retainsIncompleteAsyncCalls(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isUndefined(node.argumentListNode.closeParenthesisNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesMissingAsyncArgumentsForArgumentListRecovery(): void {
    const parser = TypeScriptParserFixture.create("async(, value)");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.areEqual(1, node.argumentListNode.children.length);
    Assert.areEqual("TS1135@6:1 Argument expression expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("(1: Value)")
  @TestData("(a + b) => a")
  @TestData("([a + b]) => a")
  @TestData("({a: b + c}) => a")
  @TestData("({method(){}}) => a")
  @TestMethod
  public doesNotTurnArbitraryExpressionsIntoParameters(content: string): void {
    const statementNode = TypeScriptParser.parse(content).rootNode.children[0];

    Assert.isInstanceOf(statementNode, TypeScriptExpressionStatementNode);
    const node = statementNode.expressionNode;
    Assert.isInstanceOf(node, TypeScriptParenthesizedExpressionNode);
  }

  @TestMethod
  public reportsATrailingCommaWithoutLosingTheClosingParenthesis(): void {
    const parser = TypeScriptParserFixture.create("(first,)");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptParenthesizedExpressionNode);
    Assert.isDefined(node.closeParenthesisNode);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    const diagnostic = parser.context.diagnosticCollector.diagnostics[0];
    Assert.areEqual("TS1109", diagnostic?.code.displayText);
    Assert.areEqual("Expression expected.", diagnostic?.message.text);
    Assert.areEqual(7, diagnostic?.location?.start);
    Assert.areEqual(1, diagnostic?.location?.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("(first ? second : third)")
  @TestData("condition ? (value) : other")
  @TestData("condition ? (first + second) : other")
  @TestData("condition ? (value = other) : last")
  @TestData("(value, other)(argument)[index].property++")
  @TestData("(value = other) + first * second")
  @TestData("((value) => value)(argument)")
  @TestMethod
  public preservesExpressionContinuations(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.parseExpression();

    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public preservesEveryOperandOfAParenthesizedCommaExpression(): void {
    const parser = TypeScriptParserFixture.create("(first, second = third, fourth)");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.expressionNode.rightNode, TypeScriptIdentifierNode);
    Assert.areEqual("fourth", node.expressionNode.rightNode.value);
    Assert.isInstanceOf(node.expressionNode.leftNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.expressionNode.leftNode.leftNode, TypeScriptIdentifierNode);
    Assert.areEqual("first", node.expressionNode.leftNode.leftNode.value);
    Assert.isInstanceOf(node.expressionNode.leftNode.rightNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.expressionNode.leftNode.rightNode.leftNode, TypeScriptIdentifierNode);
    Assert.areEqual("second", node.expressionNode.leftNode.rightNode.leftNode.value);
    Assert.isInstanceOf(node.expressionNode.leftNode.rightNode.rightNode, TypeScriptIdentifierNode);
    Assert.areEqual("third", node.expressionNode.leftNode.rightNode.rightNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("/[)]/")
  @TestData("`x${call()})`")
  @TestMethod
  public preservesContextualTokensAfterRejectingAnArrow(initializer: string): void {
    const content = " /* leading */(value = " + initializer + ")";
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptBinaryExpressionNode);
    const span = node.expressionNode.rightNode.span;
    Assert.areEqual(initializer, content.slice(span.startOffset, span.endOffset));
    Assert.isDefined(node.closeParenthesisNode);
    Assert.isDefined(node.leadingTrivia);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public preservesLeadingTriviaOnTheExpression(): void {
    const result = TypeScriptParser.parse(" (value)");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.isDefined(statement.expressionNode.leadingTrivia);
  }

  @TestMethod
  public parsesNestedParenthesizedExpressions(): void {
    const result = TypeScriptParser.parse("((value));");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.closeParenthesisNode, TypeScriptCloseParenthesisNode);
    Assert.isInstanceOf(statement.expressionNode.expressionNode, TypeScriptParenthesizedExpressionNode);
    const nestedExpression = statement.expressionNode.expressionNode;
    Assert.isInstanceOf(nestedExpression.expressionNode, TypeScriptIdentifierNode);
    Assert.isInstanceOf(nestedExpression.closeParenthesisNode, TypeScriptCloseParenthesisNode);
    Assert.areEqual(9, statement.expressionNode.span.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public readsAMissingExpressionInsideEmptyParentheses(): void {
    const result = TypeScriptParser.parse("( /* c */ )");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.expressionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(1, statement.expressionNode.expressionNode.span.startOffset);
    Assert.areEqual(0, statement.expressionNode.expressionNode.span.length);
    Assert.isUndefined(statement.expressionNode.expressionNode.leadingTrivia);
    Assert.isInstanceOf(statement.expressionNode.closeParenthesisNode, TypeScriptCloseParenthesisNode);
    Assert.areEqual(11, statement.expressionNode.span.length);
    Assert.areEqual("TS1109@10:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("(a, /* c */ )")
  @TestData("x = (a, /* c */ )")
  @TestMethod
  public readsAMissingOperandAfterATrailingComma(content: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    const expressionNode = statement.expressionNode;
    const node = expressionNode instanceof TypeScriptBinaryExpressionNode ? expressionNode.rightNode : expressionNode;
    Assert.isInstanceOf(node, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(node.expressionNode.rightNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(content.indexOf(",") + 1, node.expressionNode.rightNode.span.startOffset);
    Assert.areEqual(0, node.expressionNode.rightNode.span.length);
    Assert.areEqual(content.indexOf(",") + 1, node.expressionNode.span.endOffset);
    Assert.areEqual(`TS1109@${content.length - 1}:1`, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("delete ();", "TS1109@8:1")
  @TestData("delete (());", "TS1109@9:1")
  @TestData("delete (\n) + 1;", "TS1109@9:1")
  @TestData("delete (() as any);", "TS1109@9:1")
  @TestData("delete () as any;", "TS1109@8:1")
  @TestData("delete (,);", "TS1109@8:1|TS1109@9:1")
  @TestData("();", "TS1109@1:1")
  @TestData("x = ();", "TS1109@5:1")
  @TestData("value + ()", "TS1109@9:1")
  @TestData("f(());", "TS1109@3:1")
  @TestData("(()) => 1;", "TS1109@2:1|TS1005@5:2")
  @TestData("++();", "TS1109@3:1")
  @TestData("--(());", "TS1109@4:1")
  @TestData("()++;", "TS1109@1:1")
  @TestData("() = 1;", "TS1109@1:1")
  @TestData("(()) = 1;", "TS1109@2:1")
  @TestData("(() as any)++;", "TS1109@2:1")
  @TestData("(() satisfies any)++;", "TS1109@2:1")
  @TestData("(()!)++;", "TS1109@2:1")
  @TestData("(<any>())++;", "TS1109@7:1")
  @TestData("[()] = [1];", "TS1109@2:1")
  @TestData("[...()] = o;", "TS1109@5:1")
  @TestData("({ a: () } = o);", "TS1109@7:1")
  @TestData("({ ...() } = o);", "TS1109@7:1")
  @TestData("for (() in x);", "TS1109@6:1")
  @TestData("for (() of x);", "TS1109@6:1")
  @TestData("declare function f([a] = ()): void;", "TS1109@26:1")
  @TestData("declare function f([a = ()]): void;", "TS1109@25:1")
  @TestMethod
  public readsTheMissingExpressionEmptyParenthesesHold(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("(", "TS1109@1:0")
  @TestData("( ", "TS1109@1:0|TS1005@2:0")
  @TestData("(\n// c\n", "TS1109@1:0|TS1005@7:0")
  @TestData("x = ( ", "TS1109@5:0|TS1005@6:0")
  @TestData("value + (", "TS1109@9:0")
  @TestData("delete ( ", "TS1109@8:0|TS1005@9:0")
  @TestData("delete (\n// c\n", "TS1109@8:0|TS1005@14:0")
  @TestData("f(( ", "TS1109@3:0|TS1005@4:0")
  @TestData("(( ", "TS1109@2:0|TS1005@3:0")
  @TestData("x = (( ", "TS1109@6:0|TS1005@7:0")
  @TestData("(a, ", "TS1109@3:0|TS1005@4:0")
  @TestData("x = (a, ", "TS1109@7:0|TS1005@8:0")
  @TestData("x = (a,\n// c\n", "TS1109@7:0|TS1005@13:0")
  @TestMethod
  public reportsAnExpressionMissingAtTheEndOfTheSourceWhereItsTriviaBegins(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public reportsAMissingClosingParenthesis(): void {
    const result = TypeScriptParser.parse("(value");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.expressionNode, TypeScriptIdentifierNode);
    Assert.isUndefined(statement.expressionNode.closeParenthesisNode);
    Assert.areEqual(6, statement.expressionNode.span.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("')' expected.", result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public reportsMissingSyntaxAtEndOfInput(): void {
    const result = TypeScriptParser.parse("(");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.expressionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(1, statement.expressionNode.span.length);
    Assert.isUndefined(statement.expressionNode.closeParenthesisNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(1, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
  }

  @TestData("({ ) });", "TS1136:)")
  @TestData("!({ ) });", "TS1136:)")
  @TestData("({ a: 1, ! });", "TS1136:!,TS1005:},TS1128:)")
  @TestData("(x, { ) }) => 1;", "TS1136:),TS1005:=>")
  @TestData("(a = {) => b;", "TS1136:)")
  @TestData("(x: { ) }) => 1;", "TS1131:),TS1005:},TS1128:),TS1128:=>")
  @TestData("let f = (a: { => }) => 1;", "TS1131:=>,TS1109:},TS1128:),TS1128:=>")
  @TestData("((a = { ! }));", "TS1136:!,TS1005:},TS1128:),TS1128:)")
  @TestData("x = (a = (a = (a = { ! })));", "TS1136:!,TS1005:},TS1128:),TS1128:),TS1128:)")
  @TestData("x = (a, (a, { ! }));", "TS1136:!,TS1005:},TS1128:),TS1128:)")
  @TestMethod
  public readsAPossibleArrowHeadAsParametersBeforeAnExpression(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestMethod
  public reportsEveryCloserAroundDeeplyNestedRecoveringHeads(): void {
    const content = "x = " + "(a = ".repeat(150) + "{ ! }" + ")".repeat(150) + ";";
    const result = TypeScriptParser.parse(content);

    Assert.areEqual("TS1136:!,TS1005:}" + ",TS1128:)".repeat(150), TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("(a, b c) => 1;", "TS1005@6:1 ',' expected.")
  @TestData("(a = { ! }) => 1;", "TS1136@7:1 Property assignment expected.|TS1005@9:1 ',' expected.")
  @TestData("(a = 1 b) => 1;", "TS1005@7:1 ',' expected.")
  @TestData("(a: T b) => 1;", "TS1005@6:1 ',' expected.")
  @TestData("f((a, b c) => 1);", "TS1005@8:1 ',' expected.")
  @TestData("(a, b c): T => 1;", "TS1005@6:1 ',' expected.")
  @TestData("(a, b c) => { };", "TS1005@6:1 ',' expected.")
  @TestData("<T>(a, b c) => 1;", "TS1005@9:1 ',' expected.")
  @TestData("(a, b c)\n=> 1;", "TS1005@6:1 ',' expected.")
  @TestData("x ? (a, b c) => 1 : 2;", "TS1005@10:1 ',' expected.")
  @TestData("(a, b c) { }", "TS1005@6:1 ',' expected.|TS1005@9:1 '=>' expected.")
  @TestData("(a b) => 1;", "TS1005@3:1 ')' expected.|TS1128@4:1 Declaration or statement expected.|TS1128@6:2 Declaration or statement expected.")
  @TestData("(a, b c);", "TS1005@6:1 ')' expected.|TS1128@7:1 Declaration or statement expected.")
  @TestData("async (a, b c) => 1;", "TS1005@12:1 ',' expected.")
  @TestData("async (a, b c);", "TS1005@12:1 ',' expected.")
  @TestData("async (a, b c;", "TS1005@12:1 ',' expected.|TS1005@13:1 ')' expected.")
  @TestData("async function f() { async (a, b c); }", "TS1005@33:1 ',' expected.")
  @TestData("async function f() { async (a b); }", "TS1005@30:1 ',' expected.")
  @TestMethod
  public readsAHeadOnPastAMissingCommaAsTheReferencesListsDo(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("declare const x: any; for (var k = (() => 1) in x) {}", "TS1189@31:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = <any>(a in b);;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = (a) in x) {}", "TS1189@47:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = (a, b) in x) {}", "TS1189@47:1")
  @TestMethod
  public readsInAsAnOperatorWithinParentheses(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("export {}; ({ ...a: b }) => 1;", "")
  @TestData("export {}; declare let o: any; ({ ...a: b } = o) => 1;", "")
  @TestData("export {}; ({ a, ...b: c }) => 1;", "")
  @TestData("export {}; ({ a: { ...b: c } }) => 1;", "")
  @TestData("export {}; declare let x: any; x = ({ ...a: b }) => 1;", "")
  @TestData("export {}; ([...a = 1]) => 1;", "TS1186@18:1")
  @TestData("export {}; declare let o: any; ([...a = 1] = o) => 1;", "TS1186@38:1")
  @TestData("export {}; ({ ...a = 1 }) => 1;", "TS1186@19:1")
  @TestData("export {}; ([a, ...b = 1]) => 1;", "TS1186@21:1")
  @TestData("export {}; ([...[a] = 1]) => 1;", "TS1186@20:1")
  @TestData("export {}; ({ ...{ a } }) => 1;", "TS1003@17:1")
  @TestData("export {}; declare let o: any; ({ ...{} } = o) => 1;", "TS1003@37:1")
  @TestData("export {}; declare function f(x: any): void; f(({ ...{} }) => 1);", "TS1003@53:1")
  @TestData("export {}; ({ ...[] }) => 1;", "TS1109@18:1|TS1005@20:1")
  @TestData("export {}; ({ a: 1 }) => 1;", "TS1003@17:1|TS1005@19:1")
  @TestData("export {}; declare let a: any; ({ ...a.b }) => 1;", "TS1005@38:1")
  @TestData("export {}; declare let a: any; ([...a.b]) => 1;", "TS1005@37:1")
  @TestData("export {}; ({ a: 1 }, b) => 1;", "TS1003@17:1|TS1005@19:1")
  @TestData("export {}; ({ a: 1 }) => { };", "TS1003@17:1|TS1005@19:1")
  @TestData("export {}; ({ a: b.c }) => 1;", "TS1005@18:1")
  @TestData("export {}; ([a.b]) => 1;", "TS1005@14:1")
  @TestData("export {}; ({ this }) => 1;", "TS1005@19:1")
  @TestData("export {}; ({ #a }) => 1;", "TS1005@17:1")
  @TestData("export {}; ([{ a: 1 }]) => 1;", "TS1003@18:1|TS1005@20:1")
  @TestData("export {}; ({ a: 1 }) =>", "TS1003@17:1|TS1005@19:1|TS1109@24:0")
  @TestData("export {}; declare let a: any; ({ a });", "")
  @TestData("export {}; declare let a: any; ({ a: 1 });", "")
  @TestData("export {}; declare let a: any, b: any; ({ a } = b);", "")
  @TestData("export {}; declare let a: any, b: any; ([a] = b);", "")
  @TestData("export {}; ([a + 1]) => 1;", "TS1005@21:2")
  @TestData("export {}; ({ a }?) => 1;", "TS2463@12:6")
  @TestData("export {}; ({ a }) \n => 1;", "TS1200@21:2")
  @TestData("export {}; declare let c: any; c ? ({ a }) : 1;", "")
  @TestData("export {}; function* f() { ({ yield }) => 1; }", "TS1214@30:5")
  @TestData("export {}; ({ a = await 1 }) => 1;", "TS1308@18:5")
  @TestData("export {}; declare let a: any; (a, { b: 1 }) => 1;", "TS1003@40:1|TS1005@42:1")
  @TestData("export {}; declare let a: any; (a, [...b = 1]) => 1;", "TS1186@41:1")
  @TestData("export {}; declare let a: any; (a, { ...b: c }) => 1;", "")
  @TestData("export {}; declare let a: any; (a = 1, { ...{} }) => 1;", "TS1003@44:1")
  @TestData("export {}; declare let a: any, o: any; (a, { b: 1 } = o) => 1;", "TS1003@48:1|TS1005@50:1")
  @TestData("export {}; declare let a: any; (a, [b.c]) => 1;", "TS1005@37:1")
  @TestData("export {}; declare let a: any; async (a, { b: 1 }) => 1;", "TS1003@46:1|TS1005@48:1")
  @TestData("export {}; declare let a: any; (a, { b: 1 }): any => 1;", "TS1003@40:1|TS1005@42:1")
  @TestData("export {}; declare let a: any; (a, { b: 1 }) => { };", "TS1003@40:1|TS1005@42:1")
  @TestData("export {}; declare let a: any, b: any, c: any; (a, public { eval }) => 1;", "TS1187@51:15|TS2369@51:15|TS1215@60:4")
  @TestData("'use strict'; export {}; declare let a: any, b: any, c: any; (a, ...[eval]) => 1;", "TS1215@69:4")
  @TestData("'use strict'; export {}; declare let a: any, b: any, c: any; ({ eval }) => 1;", "TS1215@64:4")
  @TestData("'use strict'; export {}; declare let a: any, b: any, c: any; ([arguments]) => 1;", "TS1215@63:9")
  @TestData("export {}; declare let a: any, b: any, c: any; (a + 1, {b}: any);", "TS1005@58:1|TS1434@60:3|TS1128@63:1")
  @TestMethod
  public readsAHeadThatWritesAPatternAsParameters(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("(await) => 1;\nexport {};", "")
  @TestData("(await, b) => 1;\nexport {};", "")
  @TestData("(a, await) => 1;\nexport {};", "")
  @TestData("(a, await: T) => 1;\nexport {};", "")
  @TestData("(await = 1) => 1;\nexport {};", "")
  @TestData("(a, await?: T) => 1;\nexport {};", "")
  @TestData("(await, await) => 1;\nexport {};", "")
  @TestData("x ? (await) => 1 : 2;\nexport {};", "")
  @TestData("((await) => 1);\nexport {};", "")
  @TestData("declare const f = (await) => 1;\nexport {};", "")
  @TestData("class C { x = (await) => 1; }\nexport {};", "")
  @TestData("(await) => f(a if (b) c);\nexport {};", "TS1005@15:2|TS1434@22:1|TS1128@23:1")
  @TestData("(a, await) => f(a if (b) c);\nexport {};", "TS1005@18:2|TS1434@25:1|TS1128@26:1")
  @TestData("f((await) => 1, a if (b) c);\nexport {};", "TS1005@18:2|TS1434@25:1|TS1128@26:1")
  @TestData("(a = await) => 1;\nexport {};", "")
  @TestData("f((a = await) => 1, a if (b) c);\nexport {};", "TS1005@22:2|TS1005@29:1")
  @TestData("(await, b);\nexport {};", "TS1109@6:1")
  @TestData("(await) + 1;\nexport {};", "TS1109@6:1")
  @TestData("(eval) => 1;\nexport {};", "TS1215@1:4")
  @TestMethod
  public readsTheNamesAnArrowHeadBindsAsBindings(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
