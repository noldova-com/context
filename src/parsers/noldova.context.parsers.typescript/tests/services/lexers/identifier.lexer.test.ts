/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type NodeType, Source } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptIfKeywordNode,
  TypeScriptImmediateKeywordNode,
  TypeScriptKeywordNode,
  TypeScriptUnknownNode
} from "@noldova/context.parsers.typescript";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class IdentifierLexerTests {
  @TestMethod
  public readsAsciiIdentifiers(): void {
    const lexer = this.createLexer("value123+");
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.areEqual("value123", node.value);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(8, node.span.length);
    Assert.areEqual(8, lexer.reader.currentOffset);
  }

  @TestData("$value")
  @TestData("_value")
  @TestMethod
  public readsDollarAndUnderscoreIdentifiers(content: string): void {
    const lexer = this.createLexer(content);
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.areEqual(content, node.value);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(content.length, node.span.length);
    Assert.areEqual(content.length, lexer.reader.currentOffset);
  }

  @TestMethod
  public readsUnicodeIdentifiersByCodePoint(): void {
    const value = `π${String.fromCodePoint(0x10400)}${String.fromCodePoint(0x2EBF0)}0`;
    const lexer = this.createLexer(value);
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.areEqual(value, node.value);
    Assert.areEqual(value.length, node.span.length);
    Assert.areEqual(value.length, lexer.reader.currentOffset);
  }

  @TestMethod
  public decodesUnicodeEscapesInIdentifiers(): void {
    const sourceText = "\\u0061\\u{62}c+";
    const lexer = this.createLexer(sourceText);
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.areEqual("abc", node.value);
    Assert.areEqual(13, node.span.length);
    Assert.areEqual(13, lexer.reader.currentOffset);
  }

  @TestData("if", TypeScriptIfKeywordNode)
  @TestData("immediate", TypeScriptImmediateKeywordNode)
  @TestMethod
  public recognizesKeywordNodes(content: string, expectedType: Function & NodeType): void {
    const node = this.createLexer(content).lex();

    Assert.isInstanceOf(node, TypeScriptKeywordNode);
    Assert.isInstanceOf(node, expectedType);
  }

  @TestMethod
  public preservesEscapedKeywordSpellingWithoutDecidingItsGrammarRole(): void {
    const lexer = this.createLexer("\\u0069f");
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIfKeywordNode);
    Assert.areEqual("if", node.value);
    Assert.areEqual(7, node.span.length);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public keepsKeywordPrefixesAsIdentifiers(): void {
    const lexer = this.createLexer("ifStatement");
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.areEqual("ifStatement", node.value);
  }

  @TestMethod
  public preservesLeadingTrivia(): void {
    const lexer = this.createLexer(" value");
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.isDefined(node.leadingTrivia);
  }

  @TestData("😀value", 2)
  @TestData("\\u00G0value", 1)
  @TestMethod
  public delegatesInvalidStartsToTheOwningLexer(content: string, expectedOffset: number): void {
    const lexer = this.createLexer(content);

    Assert.isInstanceOf(lexer.lex(), TypeScriptUnknownNode);
    Assert.areEqual(expectedOffset, lexer.reader.currentOffset);
  }

  @TestMethod
  public stopsBeforeNonIdentifierText(): void {
    const lexer = this.createLexer("value\\u002Dnext");
    const node = lexer.lex();

    Assert.isInstanceOf(node, TypeScriptIdentifierNode);
    Assert.areEqual("value", node.value);
    Assert.areEqual(5, lexer.reader.currentOffset);
  }

  private createLexer(content: string): TypeScriptLexer {
    return TypeScriptLexerFixture.create(new Source(content, "source.ts"));
  }
}
