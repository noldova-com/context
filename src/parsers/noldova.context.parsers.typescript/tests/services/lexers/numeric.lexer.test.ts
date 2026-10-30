/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptBigIntLiteralNode, TypeScriptNumericLiteralNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class NumericLexerTests {
  @TestData("0")
  @TestData("42")
  @TestData(".5")
  @TestData("1.")
  @TestData("3.14")
  @TestData("1e10")
  @TestData("1e+10")
  @TestData("1e-10")
  @TestData("1.e2")
  @TestData("1_000")
  @TestData("1.2_3e4_5")
  @TestMethod
  public readsDecimalForms(value: string): void {
    const lexer = this.createLexer(value);
    const node = this.lex(lexer);

    Assert.isInstanceOf(node, TypeScriptNumericLiteralNode);
    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, node.span.length);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("0xFF")
  @TestData("0Xab_cd")
  @TestData("0b1010")
  @TestData("0B10_01")
  @TestData("0o755")
  @TestData("0O7_0")
  @TestMethod
  public readsRadixForms(value: string): void {
    const lexer = this.createLexer(value);
    const node = this.lex(lexer);

    Assert.isInstanceOf(node, TypeScriptNumericLiteralNode);
    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("0n")
  @TestData("123n")
  @TestData("1_000n")
  @TestData("0xFFn")
  @TestData("0b101n")
  @TestData("0o77n")
  @TestMethod
  public readsBigIntForms(value: string): void {
    const lexer = this.createLexer(value);
    const node = this.lex(lexer);

    Assert.isInstanceOf(node, TypeScriptBigIntLiteralNode);
    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("0b102", "0b10")
  @TestData("0o78", "0o7")
  @TestData("0xFG", "0xF")
  @TestMethod
  public stopsBeforeInvalidRadixDigits(content: string, expectedValue: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(expectedValue, this.lex(lexer).value);
    Assert.areEqual(expectedValue.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("0x+", "0x", "TS1125@2:0")
  @TestData("0b", "0b", "TS1177@2:0")
  @TestData("0o", "0o", "TS1178@2:0")
  @TestMethod
  public reportsMissingRadixDigits(content: string, expectedValue: string, expected: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(expectedValue, this.lex(lexer).value);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("0_1", "TS6188@1:1")
  @TestData("1__0", "TS6189@2:1")
  @TestData("1_", "TS6188@1:1")
  @TestData("0x_1", "TS6188@2:1")
  @TestData("0b1__", "TS6189@4:1")
  @TestData("1._0", "TS6188@2:1")
  @TestMethod
  public reportsInvalidNumericSeparators(content: string, expected: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(content, this.lex(lexer).value);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("1e2n", "TS1352@0:4")
  @TestData("4.1n", "TS1353@0:4")
  @TestData(".1n", "TS1353@0:3")
  @TestMethod
  public reportsInvalidBigIntForms(content: string, expected: string): void {
    const lexer = this.createLexer(content);
    const node = this.lex(lexer);

    Assert.isInstanceOf(node, TypeScriptNumericLiteralNode);
    Assert.areEqual(content, node.value);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("1e", "1e", "TS1124@2:0")
  @TestData("1e+", "1e+", "TS1124@3:0")
  @TestData("1ee", "1e", "TS1124@2:0")
  @TestMethod
  public reportsMissingExponentDigits(content: string, expectedValue: string, expected: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(expectedValue, this.lex(lexer).value);
    Assert.areEqual(expectedValue.length, lexer.reader.currentOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("123abc", "123", "TS1351@3:3")
  @TestData("1π", "1", "TS1351@1:1")
  @TestData("1\u{10400}", "1", "TS1351@1:2")
  @TestMethod
  public reportsAndRewindsAdjacentIdentifiers(content: string, expectedValue: string, expected: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(expectedValue, this.lex(lexer).value);
    Assert.areEqual(expectedValue.length, lexer.reader.currentOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("42+", "42", "")
  @TestData("1n2", "1n", "")
  @TestData("1na", "1n", "TS1351@2:1")
  @TestMethod
  public stopsAtOrdinaryAndBigIntBoundaries(content: string, expectedValue: string, expected: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(expectedValue, this.lex(lexer).value);
    Assert.areEqual(expectedValue.length, lexer.reader.currentOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("0123", "TS1121@0:4 Octal literals are not allowed. Use the syntax '0o123'.")
  @TestData("00", "TS1121@0:2 Octal literals are not allowed. Use the syntax '0o0'.")
  @TestData("08", "TS1489@0:2 Decimals with leading zeros are not allowed.")
  @TestMethod
  public reportsLegacyOctalAndLeadingZeroDecimals(content: string, expected: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(content, this.lex(lexer).value);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("let a = - 0777;", "TS1121@9:5 Octal literals are not allowed. Use the syntax '-0o777'.")
  @TestData("let a = -/**/0777;", "TS1121@12:5 Octal literals are not allowed. Use the syntax '-0o777'.")
  @TestData("x---0777;", "TS1121@3:5 Octal literals are not allowed. Use the syntax '-0o777'.")
  @TestData("let b = 1;\nb--0777;", "TS1121@14:4 Octal literals are not allowed. Use the syntax '0o777'.")
  @TestData("-a\n01;", "TS1121@3:2 Octal literals are not allowed. Use the syntax '0o1'.")
  @TestData("-a\nb\n01;", "TS1121@5:2 Octal literals are not allowed. Use the syntax '0o1'.")
  @TestMethod
  public takesALegacyOctalLiteralsSignFromTheTokenBeforeIt(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public respectsBoundedReaderStartsWhenReportingLegacyOctalLiterals(): void {
    const source = new Source("-01", "source.ts");
    const lexer = TypeScriptLexerFixture.create(new SourceReader(source, new SourceSpan(1, 2)));

    const node = this.lex(lexer);

    Assert.areEqual("01", node.value);
    Assert.areEqual("TS1121@1:2 Octal literals are not allowed. Use the syntax '0o1'.",
      TypeScriptDiagnosticsFixture.projectWithMessages(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesLeadingTrivia(): void {
    const lexer = this.createLexer(" 42");
    const node = this.lex(lexer);

    Assert.isDefined(node.leadingTrivia);
  }

  private createLexer(content: string): TypeScriptLexer {
    return TypeScriptLexerFixture.create(new Source(content, "source.ts"));
  }

  private lex(lexer: TypeScriptLexer): LiteralNode {
    const result = lexer.lex();
    Assert.isInstanceOf(result, LiteralNode);
    return result;
  }
}
