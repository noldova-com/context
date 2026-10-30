/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptPrivateIdentifierNode, TypeScriptUnknownNode } from "@noldova/context.parsers.typescript";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class PrivateIdentifierLexerTests {
  @TestData("#value")
  @TestData("#class")
  @TestData("#$value")
  @TestData("#_value")
  @TestData("#π")
  @TestData("#\u{10400}")
  @TestMethod
  public readsPrivateIdentifiers(value: string): void {
    const lexer = this.createLexer(value);
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptPrivateIdentifierNode);
    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, node.span.length);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public decodesUnicodeEscapes(): void {
    const sourceText = "#\\u0076\\u{61}lue";
    const lexer = this.createLexer(sourceText);
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptPrivateIdentifierNode);
    Assert.areEqual("#value", node.value);
    Assert.areEqual(sourceText.length, node.span.length);
    Assert.areEqual(sourceText.length, lexer.reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("#")
  @TestData("#1")
  @TestData("#\\u0031")
  @TestMethod
  public reportsInvalidPrivateIdentifiersAndConsumesOnlyTheHash(content: string): void {
    const lexer = this.createLexer(content);
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptPrivateIdentifierNode);
    Assert.areEqual("#", node.value);
    Assert.areEqual(1, lexer.reader.currentOffset);
    Assert.areEqual("TS1127@0:1", TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public delegatesMisplacedShebangsToInvalidCharacterLexing(): void {
    const lexer = this.createLexer("x\n#!/usr/bin/env node");
    lexer.lex();

    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptUnknownNode);
    Assert.areEqual("#", node.value);
    Assert.areEqual(3, lexer.reader.currentOffset);
    Assert.areEqual("TS18026@2:2", TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public preservesLeadingTrivia(): void {
    const lexer = this.createLexer(" #value");
    const node = lexer.lex();

    Assert.isDefined(node.leadingTrivia);
  }

  private createLexer(content: string): TypeScriptLexer {
    return TypeScriptLexerFixture.create(new Source(content, "source.ts"));
  }
}
