/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type NodeType, ValueNode } from "@noldova/context.parsers";
import { RegexNode } from "@noldova/context.parsers.regex";
import { TypeScriptSlashEqualsNode, TypeScriptSlashNode } from "@noldova/context.parsers.typescript";
import type { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class SlashLexerTests {
  @TestData("/remaining", TypeScriptSlashNode, "/")
  @TestData("/=remaining", TypeScriptSlashEqualsNode, "/=")
  @TestMethod
  public lexesSlashOperators(content: string, expectedType: Function & NodeType, expectedValue: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;

    Assert.isInstanceOf(node, ValueNode);
    Assert.isInstanceOf(node, expectedType);
    Assert.areEqual(expectedValue, node.value);
    Assert.areEqual(expectedValue.length, parser.typescriptLexer.reader.currentOffset);
  }

  @TestData("/abc/")
  @TestData("/a\\/b/")
  @TestData("/[a/b]/")
  @TestData("/[[]/")
  @TestData("/😀/")
  @TestMethod
  public reLexesRegularExpressionBodies(value: string): void {
    const parser = TypeScriptParserFixture.create(value);
    const node = this.reLexRegularExpression(parser);

    Assert.areEqual(value, node.rawValue);
    Assert.areEqual(value.length, node.span.length);
    Assert.areEqual(value.length, node.span.endOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public consumesIdentifierPartFlags(): void {
    const astralFlag = String.fromCodePoint(0x10400);
    const value = `/abc/g1$π${astralFlag}-remaining`;
    const parser = TypeScriptParserFixture.create(value);

    const node = this.reLexRegularExpression(parser);

    const expected = `/abc/g1$π${astralFlag}`;
    Assert.areEqual(expected, node.rawValue);
    Assert.areEqual("abc", node.patternNode.value);
    Assert.areEqual(`g1$π${astralFlag}`, node.flagsNode.value);
    Assert.areEqual(expected.length, node.span.endOffset);
    Assert.areEqual("CTX1000@6:1|CTX1000@7:1|CTX1000@8:1|CTX1000@9:2",
      TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("/abc")
  @TestData("/abc\nremaining")
  @TestData("/abc\rremaining")
  @TestData("/abc\r\nremaining")
  @TestData("/abc remaining")
  @TestData("/abc remaining")
  @TestMethod
  public reportsUnterminatedRegularExpressionsAtEndAndLineBreaks(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = this.reLexRegularExpression(parser);

    Assert.areEqual("/abc", node.rawValue);
    Assert.areEqual(4, node.span.endOffset);
    Assert.areEqual("TS1161@0:4", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public recoversBeforeTrailingWhitespaceAndSemicolons(): void {
    const parser = TypeScriptParserFixture.create("/abc  ;\t");

    const node = this.reLexRegularExpression(parser);

    Assert.areEqual("/abc", node.rawValue);
    Assert.areEqual(4, node.span.endOffset);
    Assert.areEqual("TS1161@0:4", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("/abc )remaining")
  @TestData("/abc ]remaining")
  @TestData("/abc }remaining")
  @TestMethod
  public recoversBeforeUnbalancedClosingDelimiters(content: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = this.reLexRegularExpression(parser);

    Assert.areEqual("/abc", node.rawValue);
    Assert.areEqual("TS1161@0:4", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("/(abc)", "TS1161@0:6")
  @TestData("/[abc]", "TS1161@0:6")
  @TestData("/a{1}", "TS1161@0:5")
  @TestData("/abc\\)", "TS1161@0:6")
  @TestMethod
  public preservesBalancedAndEscapedRecoveryText(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = this.reLexRegularExpression(parser);

    Assert.areEqual(content, node.rawValue);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("/(/-remaining", "/(/", "CTX1003@2:0")
  @TestData("/abc/ggunknown", "/abc/ggunknown", "CTX1001@6:1|CTX1000@8:1|CTX1000@9:1|CTX1000@10:1|CTX1000@11:1|CTX1000@12:1|CTX1000@13:1")
  @TestMethod
  public delegatesPatternAndFlagDiagnosticsToRegexParser(content: string, expectedRawValue: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = this.reLexRegularExpression(parser);

    Assert.areEqual(expectedRawValue, node.rawValue);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesTheSpanAndLeadingTriviaOfASlashOperator(): void {
    const node = TypeScriptParserFixture.create(" /remaining").currentNode;

    Assert.isInstanceOf(node, TypeScriptSlashNode);
    Assert.areEqual(1, node.span.startOffset);
    Assert.isDefined(node.leadingTrivia);
  }

  @TestMethod
  public preservesTheSpanAndLeadingTriviaOfARegularExpression(): void {
    const node = this.reLexRegularExpression(TypeScriptParserFixture.create(" /abc/"));

    Assert.areEqual(1, node.span.startOffset);
    Assert.isDefined(node.leadingTrivia);
  }

  private reLexRegularExpression(parser: TypeScriptSyntaxParser): RegexNode {
    const result = parser.parsePrimaryExpression();
    Assert.isInstanceOf(result, RegexNode);
    return result;
  }
}
