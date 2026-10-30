/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptLexerFixture } from "../../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class TypeScriptEscapeSequenceReaderTests {
  @TestData("\"\\0\"")
  @TestData("\"\\n\"")
  @TestData("\"\\x41\"")
  @TestData("\"\\u0042\"")
  @TestData("\"\\u{43}\"")
  @TestData("\"\\😀\"")
  @TestData("\"\\\r\n\"")
  @TestMethod
  public readsValidEscapeSequences(content: string): void {
    const lexer = this.createLexer(content);

    lexer.lex();

    Assert.areEqual(content.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("\"\\xG\"", "TS1125@3:0")
  @TestData("\"\\x0\"", "TS1125@4:0")
  @TestData("\"\\xGG\"", "TS1125@3:0")
  @TestData("\"\\u00\"", "TS1125@5:0")
  @TestData("\"\\u00GG\"", "TS1125@5:0")
  @TestData("\"\\u{}\"", "TS1125@4:0")
  @TestData("\"\\u{1G}\"", "TS1199@5:0")
  @TestData("\"\\u{67\"", "TS1199@6:0")
  @TestData("\"\\u{67", "TS1126@6:0")
  @TestData("\"\\u{110000}\"", "TS1198@4:6")
  @TestMethod
  public reportsInvalidHexadecimalAndUnicodeEscapes(content: string, expected: string): void {
    const lexer = this.createLexer(content);

    lexer.lex();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("\"\\5\"", "TS1487@1:2 Octal escape sequences are not allowed. Use the syntax '\\x05'.")
  @TestData("\"\\177\"", "TS1487@1:4 Octal escape sequences are not allowed. Use the syntax '\\x7f'.")
  @TestData("\"\\477\"", "TS1487@1:3 Octal escape sequences are not allowed. Use the syntax '\\x27'.")
  @TestData("\"\\087\"", "TS1487@1:2 Octal escape sequences are not allowed. Use the syntax '\\x00'.")
  @TestData("\"\\8\"", "TS1488@1:2 Escape sequence '\\8' is not allowed.")
  @TestData("\"\\9\"", "TS1488@1:2 Escape sequence '\\9' is not allowed.")
  @TestMethod
  public reportsLegacyOctalAndDecimalEscapeSequences(content: string, expected: string): void {
    const lexer = this.createLexer(content);

    lexer.lex();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(lexer.diagnosticCollector.diagnostics));
  }

  @TestData("`\\xG`")
  @TestData("`\\u{}`")
  @TestData("`\\u{110000}`")
  @TestData("`\\5`")
  @TestData("`\\9`")
  @TestMethod
  public suppressesInvalidEscapeDiagnosticsWhenRequested(content: string): void {
    const lexer = this.createLexer(content);

    lexer.lex();

    Assert.areEqual(content.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  private createLexer(content: string): TypeScriptLexer {
    return TypeScriptLexerFixture.create(new Source(content, "source.ts"));
  }
}
