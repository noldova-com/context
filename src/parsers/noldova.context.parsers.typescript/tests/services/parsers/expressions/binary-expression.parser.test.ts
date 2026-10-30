/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptAsExpressionNode,
  TypeScriptBinaryExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptParser,
  TypeScriptSatisfiesExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class BinaryExpressionParserTests {
  @TestData("(left || middle) ?? right")
  @TestData("(left && middle) ?? right")
  @TestData("left ?? (middle || right)")
  @TestData("left ?? (middle && right)")
  @TestMethod
  public respectsParenthesesAroundLogicalAndCoalescingMixtures(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    parser.parseExpression();

    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestData("**")
  @TestData("*")
  @TestData("/")
  @TestData("%")
  @TestData("+")
  @TestData("-")
  @TestData("<<")
  @TestData(">>")
  @TestData(">>>")
  @TestData("<")
  @TestData("<=")
  @TestData(">")
  @TestData(">=")
  @TestData("in")
  @TestData("instanceof")
  @TestData("==")
  @TestData("!=")
  @TestData("===")
  @TestData("!==")
  @TestData("&")
  @TestData("^")
  @TestData("|")
  @TestData("&&")
  @TestData("||")
  @TestData("??")
  @TestMethod
  public parsesEveryBinaryOperator(operator: string): void {
    const parser = TypeScriptParserFixture.create(`left ${operator} right`);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.areEqual(operator, parser.typescriptLexer.reader.source.getText(node.operatorNode.span));
    Assert.isInstanceOf(node.rightNode, TypeScriptIdentifierNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public preservesPrecedenceAndExponentiationAssociativity(): void {
    const precedenceNode = TypeScriptParserFixture.create("first + second * third").parseExpression();
    const exponentiationNode = TypeScriptParserFixture.create("first ** second ** third").parseExpression();

    Assert.isInstanceOf(precedenceNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(precedenceNode.rightNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(exponentiationNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(exponentiationNode.rightNode, TypeScriptBinaryExpressionNode);
  }

  @TestData("first ?? second || third", "'??' and '||' operations cannot be mixed without parentheses.")
  @TestData("first || second ?? third", "'||' and '??' operations cannot be mixed without parentheses.")
  @TestData("first ?? second && third", "'??' and '&&' operations cannot be mixed without parentheses.")
  @TestData("first && second ?? third", "'&&' and '??' operations cannot be mixed without parentheses.")
  @TestMethod
  public reportsUnparenthesizedLogicalAndCoalescingMixtures(value: string, message: string): void {
    const parser = TypeScriptParserFixture.create(value);

    parser.parseExpression();
    const nodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);

    Assert.areEqual(1, nodeGrammarDiagnostics.length);
    Assert.areEqual("TS5076", nodeGrammarDiagnostics[0]?.code.displayText);
    Assert.areEqual(message, nodeGrammarDiagnostics[0]?.message.text);
  }

  @TestMethod
  public permitsOtherBinaryExpressionsBesideCoalescing(): void {
    const parser = TypeScriptParserFixture.create("first + second ?? third");

    parser.parseExpression();

    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesTypeScriptAssertionOperators(): void {
    const asNode = TypeScriptParserFixture.create("value as Value").parseExpression();
    const satisfiesNode = TypeScriptParserFixture.create("value satisfies Value").parseExpression();
    const lowerPrecedenceNode = TypeScriptParserFixture.create("left ** right as Value").parseExpression();

    Assert.isInstanceOf(asNode, TypeScriptAsExpressionNode);
    Assert.isInstanceOf(satisfiesNode, TypeScriptSatisfiesExpressionNode);
    Assert.isInstanceOf(lowerPrecedenceNode, TypeScriptAsExpressionNode);
  }

  @TestData("value << 2 >> 1")
  @TestData("value << 2 >>> 1")
  @TestData("value <<= 2")
  @TestData("value < other >> 1")
  @TestMethod
  public parsesShiftOperatorsWithoutRelexingAfterTentativeErrors(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("f<<2>>();", "TS1109@7:1", 1)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }
}
