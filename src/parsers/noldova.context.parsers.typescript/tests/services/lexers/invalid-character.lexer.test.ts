/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory } from "@noldova/context.diagnostics";
import { Source } from "@noldova/context.parsers";
import { TypeScriptNonTextFileMarkerNode, TypeScriptParser, TypeScriptUnknownNode } from "@noldova/context.parsers.typescript";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class InvalidCharacterLexerTests {
  @TestMethod
  public reportsTS1127ForAnInvalidCharacter(): void {
    const lexer = TypeScriptLexerFixture.create(new Source("\0value", "source.ts"));
    const result = this.lex(lexer);

    Assert.areEqual("\0", result.value);
    Assert.areEqual(1, lexer.reader.currentOffset);
    Assert.areEqual(1, lexer.diagnosticCollector.diagnostics.length);
    const diagnostic = lexer.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual(DiagnosticAuthority.typeScript, diagnostic.code.authority);
    Assert.areEqual(1127, diagnostic.code.value);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("Invalid character.", diagnostic.message.text);
    Assert.isDefined(diagnostic.location);
    Assert.areEqual(0, diagnostic.location.start);
    Assert.areEqual(1, diagnostic.location.length);
  }

  @TestMethod
  public consumesOneUnicodeCodePoint(): void {
    const lexer = TypeScriptLexerFixture.create(new Source("😀value", "source.ts"));
    const result = this.lex(lexer);

    Assert.areEqual("😀", result.value);
    Assert.areEqual(2, result.span.length);
    Assert.areEqual(2, lexer.reader.currentOffset);
    Assert.areEqual("TS1127@0:2", TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsTS18026ForAMisplacedShebang(): void {
    const lexer = TypeScriptLexerFixture.create(new Source("x\n#!/usr/bin/env node", "source.ts"));
    lexer.lex();

    const result = lexer.lex();
    Assert.isInstanceOf(result, TypeScriptUnknownNode);

    Assert.areEqual("#", result.value);
    Assert.areEqual(3, lexer.reader.currentOffset);
    Assert.isDefined(result.leadingTrivia);
    Assert.areEqual(1, lexer.diagnosticCollector.diagnostics.length);
    const diagnostic = lexer.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual(DiagnosticAuthority.typeScript, diagnostic.code.authority);
    Assert.areEqual(18026, diagnostic.code.value);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("'#!' can only be used at the start of a file.", diagnostic.message.text);
    Assert.isDefined(diagnostic.location);
    Assert.areEqual(2, diagnostic.location.start);
    Assert.areEqual(2, diagnostic.location.length);
  }

  @TestMethod
  public reportsTS1490OnceAtTheStartAndReadsNothingFurtherForAReplacementCharacter(): void {
    const replacement = String.fromCharCode(0xFFFD);
    const lexer = TypeScriptLexerFixture.create(new Source(`x ${replacement}rest
more`, "source.ts"));
    lexer.lex();

    const result = lexer.lex();

    Assert.isInstanceOf(result, TypeScriptNonTextFileMarkerNode);
    Assert.areEqual(`${replacement}rest
more`, result.value);
    Assert.areEqual(2, result.span.startOffset);
    Assert.areEqual(lexer.reader.endOffset, lexer.reader.currentOffset);
    Assert.areEqual(1, lexer.diagnosticCollector.diagnostics.length);
    const diagnostic = lexer.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual(1490, diagnostic.code.value);
    Assert.areEqual("File appears to be binary.", diagnostic.message.text);
    Assert.areEqual(0, diagnostic.location?.start);
    Assert.areEqual(0, diagnostic.location?.length);
  }

  @TestMethod
  public reportsOnlyTS1490ForAFileThatIsNotTextFromItsStart(): void {
    const result = TypeScriptParser.parse(`${String.fromCharCode(0xFFFD)}x = 1;`);

    Assert.areEqual("TS1490@0:0", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  private lex(lexer: TypeScriptLexer): TypeScriptUnknownNode {
    const result = lexer.lex();
    Assert.isInstanceOf(result, TypeScriptUnknownNode);
    return result;
  }
}
