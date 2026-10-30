/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteralNode, Source } from "@noldova/context.parsers";
import { TypeScriptStringLiteralNode } from "@noldova/context.parsers.typescript";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class StringLexerTests {
  @TestData("\"\"")
  @TestData("''")
  @TestData("\"hello world\"")
  @TestData("'hello world'")
  @TestMethod
  public readsSingleAndDoubleQuotedStrings(value: string): void {
    const lexer = this.createLexer(value);
    const node = this.lex(lexer);

    Assert.isInstanceOf(node, TypeScriptStringLiteralNode);
    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, node.span.length);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("\"\\0\\b\\t\\n\\v\\f\\r\\'\\\"\\\\\"")
  @TestData("'\\x41\\u0042\\u{43}'")
  @TestData("'\\u{10FFFF}'")
  @TestData("\"\\q\\😀\"")
  @TestMethod
  public preservesValidEscapeSequencesAsSourceText(value: string): void {
    const lexer = this.createLexer(value);
    const node = this.lex(lexer);

    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("\n")
  @TestData("\r")
  @TestData("\r\n")
  @TestData(" ")
  @TestData(" ")
  @TestMethod
  public readsLineContinuations(lineSeparator: string): void {
    const value = `"before\\${lineSeparator}after"`;
    const lexer = this.createLexer(value);
    const node = this.lex(lexer);

    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public acceptsUnescapedUnicodeLineAndParagraphSeparators(): void {
    const lineSeparator = String.fromCodePoint(0x2028);
    const paragraphSeparator = String.fromCodePoint(0x2029);
    const value = `"before${lineSeparator}${paragraphSeparator}after"`;
    const lexer = this.createLexer(value);

    const node = this.lex(lexer);

    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("\"value\nnext", "\"value", "TS1002@6:0")
  @TestData("'value\rnext", "'value", "TS1002@6:0")
  @TestData("\"value", "\"value", "TS1002@6:0")
  @TestData("\"value'", "\"value'", "TS1002@7:0")
  @TestMethod
  public reportsUnterminatedStringsAtTheirTerminator(content: string, expectedValue: string, expected: string): void {
    const lexer = this.createLexer(content);

    Assert.areEqual(expectedValue, this.lex(lexer).value);
    Assert.areEqual(expectedValue.length, lexer.reader.currentOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsUnexpectedEndAfterBackslashWithoutDuplicateUnterminatedDiagnostic(): void {
    const lexer = this.createLexer("\"\\");

    const node = this.lex(lexer);

    Assert.areEqual("\"\\", node.value);
    Assert.areEqual(2, lexer.reader.currentOffset);
    Assert.areEqual("TS1126@2:0", TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesLeadingTrivia(): void {
    const lexer = this.createLexer(" \"value\"");
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
