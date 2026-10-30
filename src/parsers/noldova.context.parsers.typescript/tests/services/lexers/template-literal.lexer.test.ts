/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode, type NodeType } from "@noldova/context.parsers";
import {
  TypeScriptNoSubstitutionTemplateLiteralNode,
  TypeScriptTemplateExpressionNode,
  TypeScriptTemplateHeadNode,
  TypeScriptTemplateMiddleNode,
  TypeScriptTemplateSpanNode,
  TypeScriptTemplateTailNode
} from "@noldova/context.parsers.typescript";
import type { TypeScriptSyntaxParser } from "@noldova/context.parsers.typescript/services/typescript-syntax.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TemplateLiteralLexerTests {
  @TestData("``")
  @TestData("`value`")
  @TestData("`before\r\nafter`")
  @TestData("`before\nafter`")
  @TestData("`😀`")
  @TestMethod
  public readsNoSubstitutionTemplateLiterals(value: string): void {
    const parser = TypeScriptParserFixture.create(value);
    const node = this.parseLiteral(parser);

    Assert.isInstanceOf(node, TypeScriptNoSubstitutionTemplateLiteralNode);
    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, node.span.length);
    Assert.areEqual(value.length, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public readsTemplateHeads(): void {
    const parser = TypeScriptParserFixture.create("`before${after}`");

    const expression = parser.parseExpression();
    Assert.isInstanceOf(expression, TypeScriptTemplateExpressionNode);
    const node = expression.headNode;

    Assert.isInstanceOf(node, TypeScriptTemplateHeadNode);
    Assert.areEqual("`before${", node.value);
    Assert.areEqual(9, node.span.length);
    Assert.areEqual(parser.typescriptLexer.reader.source.length, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public readsTemplateMiddlesAndTailsFromClosingBraces(): void {
    const parser = TypeScriptParserFixture.create("`before${first}middle${second}tail`");
    const expression = parser.parseExpression();
    Assert.isInstanceOf(expression, TypeScriptTemplateExpressionNode);

    const middle = this.getSpanLiteral(expression, 0);
    const tail = this.getSpanLiteral(expression, 1);

    Assert.isInstanceOf(middle, TypeScriptTemplateMiddleNode);
    Assert.areEqual("}middle${", middle.value);
    Assert.isInstanceOf(tail, TypeScriptTemplateTailNode);
    Assert.areEqual("}tail`", tail.value);
    Assert.areEqual(parser.typescriptLexer.reader.source.length, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public escapedDelimitersRemainTemplateText(): void {
    const escapedBacktickParser = TypeScriptParserFixture.create("`before\\`after`");
    const escapedSubstitutionParser = TypeScriptParserFixture.create("`before\\${after}`");
    const escapedBackslashParser = TypeScriptParserFixture.create("`before\\\\${after");

    const escapedBacktick = this.parseLiteral(escapedBacktickParser);
    const escapedSubstitution = this.parseLiteral(escapedSubstitutionParser);
    const escapedBackslashExpression = escapedBackslashParser.parseExpression();

    Assert.isInstanceOf(escapedBacktick, TypeScriptNoSubstitutionTemplateLiteralNode);
    Assert.areEqual("`before\\`after`", escapedBacktick.value);
    Assert.isInstanceOf(escapedSubstitution, TypeScriptNoSubstitutionTemplateLiteralNode);
    Assert.areEqual("`before\\${after}`", escapedSubstitution.value);
    Assert.isInstanceOf(escapedBackslashExpression, TypeScriptTemplateExpressionNode);
    Assert.areEqual("`before\\\\${", escapedBackslashExpression.headNode.value);
  }

  @TestData("\n")
  @TestData("\r")
  @TestData("\r\n")
  @TestData(" ")
  @TestData(" ")
  @TestMethod
  public preservesEscapeSequencesAndLineContinuationsAsSourceText(lineSeparator: string): void {
    const value = `\`before\\${lineSeparator}after\\x41\\u0042\\u{43}\``;
    const parser = TypeScriptParserFixture.create(value);
    const node = this.parseLiteral(parser);

    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsAnUnterminatedNoSubstitutionTemplateAtItsEnd(): void {
    const parser = TypeScriptParserFixture.create("`value");

    const node = this.parseLiteral(parser);

    Assert.isInstanceOf(node, TypeScriptNoSubstitutionTemplateLiteralNode);
    Assert.areEqual("`value", node.value);
    Assert.areEqual("TS1160@6:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsAnUnterminatedTemplateTailAtItsEnd(): void {
    const parser = TypeScriptParserFixture.create("`head${value}tail");

    const expression = parser.parseExpression();
    Assert.isInstanceOf(expression, TypeScriptTemplateExpressionNode);
    const tail = this.getSpanLiteral(expression, 0);

    Assert.isInstanceOf(tail, TypeScriptTemplateTailNode);
    Assert.areEqual("}tail", tail.value);
    Assert.areEqual("TS1160@17:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public taggedTemplatesSuppressInvalidEscapeDiagnostics(): void {
    const parser = TypeScriptParserFixture.create("tag`\\xG\\u{}\\5\\9`");

    parser.parseExpression();

    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("`\\xG\\u{}\\5\\9`", TypeScriptNoSubstitutionTemplateLiteralNode, "TS1125@3:0|TS1125@7:0|TS1487@8:2|TS1488@10:2")
  @TestData("`\\xG${after}`", TypeScriptTemplateExpressionNode, "TS1125@3:0")
  @TestMethod
  public reportsInvalidEscapesWhenReLexingUntaggedTemplates(content: string, expectedType: Function & NodeType, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, expectedType);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("`\\xG`", true)
  @TestData("`\\u{110000}`", true)
  @TestData("`\\u{41", true)
  @TestData("`\\01`", true)
  @TestData("`\\8`", true)
  @TestData("`plain\\n\\x41\\u{41}`", false)
  @TestData("`\\", false)
  @TestMethod
  public marksAnInvalidEscapeTheFirstReadingPassesOver(content: string, expected: boolean): void {
    const node = TypeScriptParserFixture.create(content).currentNode;

    Assert.isInstanceOf(node, TypeScriptNoSubstitutionTemplateLiteralNode);
    Assert.areEqual(expected, node.containsInvalidEscape);
  }

  @TestData("`\\xG${after}`", true)
  @TestData("`head${after}`", false)
  @TestMethod
  public marksAnInvalidEscapeInATemplateHead(content: string, expected: boolean): void {
    const node = TypeScriptParserFixture.create(content).currentNode;

    Assert.isInstanceOf(node, TypeScriptTemplateHeadNode);
    Assert.areEqual(expected, node.containsInvalidEscape);
  }

  @TestMethod
  public continuationScanningUsesTaggedTemplateEscapeRules(): void {
    const taggedParser = TypeScriptParserFixture.create("tag`head${value}\\xG`");
    const untaggedParser = TypeScriptParserFixture.create("`head${value}\\xG`");

    taggedParser.parseExpression();
    const untaggedExpression = untaggedParser.parseExpression();

    Assert.areEqual(0, taggedParser.context.diagnosticCollector.diagnostics.length);
    Assert.isInstanceOf(untaggedExpression, TypeScriptTemplateExpressionNode);
    Assert.isInstanceOf(this.getSpanLiteral(untaggedExpression, 0), TypeScriptTemplateTailNode);
    Assert.areEqual("TS1125@15:0", TypeScriptDiagnosticsFixture.project(untaggedParser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsUnexpectedEndAfterBackslashWithoutDuplicateTemplateDiagnostic(): void {
    const parser = TypeScriptParserFixture.create("`\\");

    const node = this.parseLiteral(parser);

    Assert.isInstanceOf(node, TypeScriptNoSubstitutionTemplateLiteralNode);
    Assert.areEqual("TS1126@2:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesLeadingTrivia(): void {
    const initial = this.parseLiteral(TypeScriptParserFixture.create(" `value`"));

    Assert.isDefined(initial.leadingTrivia);
  }

  private parseLiteral(parser: TypeScriptSyntaxParser): LiteralNode {
    const result = parser.parseExpression();
    Assert.isInstanceOf(result, LiteralNode);
    return result;
  }

  private getSpanLiteral(expression: TypeScriptTemplateExpressionNode, index: number): LiteralNode {
    const span = expression.children[index];
    Assert.isInstanceOf(span, TypeScriptTemplateSpanNode);
    Assert.isInstanceOf(span.literalNode, LiteralNode);
    return span.literalNode;
  }
}
