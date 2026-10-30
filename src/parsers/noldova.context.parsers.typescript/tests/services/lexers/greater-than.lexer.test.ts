/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type NodeType, Source, ValueNode } from "@noldova/context.parsers";
import {
  TypeScriptBinaryExpressionNode,
  TypeScriptGreaterThanEqualsNode,
  TypeScriptGreaterThanNode,
  TypeScriptShiftRightEqualsNode,
  TypeScriptShiftRightNode,
  TypeScriptUnsignedShiftRightEqualsNode,
  TypeScriptUnsignedShiftRightNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";
import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class GreaterThanLexerTests {
  @TestData(">")
  @TestData(">=")
  @TestData(">>")
  @TestData(">>=")
  @TestData(">>>")
  @TestData(">>>=")
  @TestMethod
  public lexesOneGreaterThanAtATime(value: string): void {
    const lexer = TypeScriptLexerFixture.create(new Source(` ${value}remaining`, "source.ts"));
    const result = lexer.lex();

    Assert.isInstanceOf(result, TypeScriptGreaterThanNode);
    Assert.areEqual(">", result.value);
    Assert.areEqual(1, result.span.startOffset);
    Assert.areEqual(1, result.span.length);
    Assert.areEqual(2, lexer.reader.currentOffset);
    Assert.isDefined(result.leadingTrivia);
  }

  @TestData(">", TypeScriptGreaterThanNode)
  @TestData(">=", TypeScriptGreaterThanEqualsNode)
  @TestData(">>", TypeScriptShiftRightNode)
  @TestData(">>=", TypeScriptShiftRightEqualsNode)
  @TestData(">>>", TypeScriptUnsignedShiftRightNode)
  @TestData(">>>=", TypeScriptUnsignedShiftRightEqualsNode)
  @TestMethod
  public contextuallyReLexesEveryGreaterThanOperator(value: string, expectedType: Function & NodeType): void {
    const parser = TypeScriptParserFixture.create(`left ${value} right`);
    const expression = parser.parseExpression();
    Assert.isInstanceOf(expression, TypeScriptBinaryExpressionNode);
    const result = expression.operatorNode;

    Assert.isInstanceOf(result, ValueNode);
    Assert.isInstanceOf(result, expectedType);
    Assert.areEqual(value, result.value);
    Assert.areEqual(5, result.span.startOffset);
    Assert.areEqual(value.length, result.span.length);
    Assert.areEqual(parser.typescriptLexer.reader.source.length, parser.typescriptLexer.reader.currentOffset);
    Assert.isDefined(result.leadingTrivia);
  }

  @TestMethod
  public reLexesAnUncombinedGreaterThanWithoutConsumingTheFollowingCharacter(): void {
    const parser = TypeScriptParserFixture.create(" >value");
    const leadingTrivia = parser.currentNode.leadingTrivia;
    parser.reLexGreaterThan();

    Assert.isInstanceOf(parser.currentNode, TypeScriptGreaterThanNode);
    Assert.areEqual(1, parser.currentNode.span.startOffset);
    Assert.areEqual(1, parser.currentNode.span.length);
    Assert.areEqual(leadingTrivia, parser.currentNode.leadingTrivia);
    Assert.areEqual(2, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
