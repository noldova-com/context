/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { EndOfFileNode, type NodeType, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAmpersandNode,
  TypeScriptAsteriskNode,
  TypeScriptAtNode,
  TypeScriptBarNode,
  TypeScriptCaretNode,
  TypeScriptCloseBraceNode,
  TypeScriptCloseBracketNode,
  TypeScriptCloseParenthesisNode,
  TypeScriptColonNode,
  TypeScriptCommaNode,
  TypeScriptDotDotDotNode,
  TypeScriptDotNode,
  TypeScriptEqualsNode,
  TypeScriptExclamationNode,
  TypeScriptGreaterThanNode,
  TypeScriptIdentifierNode,
  TypeScriptIfKeywordNode,
  TypeScriptLessThanNode,
  TypeScriptMinusNode,
  TypeScriptNoSubstitutionTemplateLiteralNode,
  TypeScriptNumericLiteralNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenBracketNode,
  TypeScriptOpenParenthesisNode,
  TypeScriptPercentNode,
  TypeScriptPlusNode,
  TypeScriptPrivateIdentifierNode,
  TypeScriptQuestionNode,
  TypeScriptSemicolonNode,
  TypeScriptSlashNode,
  TypeScriptStringLiteralNode,
  TypeScriptTildeNode,
  TypeScriptTriviaNode,
  TypeScriptUnknownNode
} from "@noldova/context.parsers.typescript";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class TypeScriptLexerTests {
  @TestData("&", TypeScriptAmpersandNode)
  @TestData("*", TypeScriptAsteriskNode)
  @TestData("@", TypeScriptAtNode)
  @TestData("|", TypeScriptBarNode)
  @TestData("^", TypeScriptCaretNode)
  @TestData("}", TypeScriptCloseBraceNode)
  @TestData("]", TypeScriptCloseBracketNode)
  @TestData(")", TypeScriptCloseParenthesisNode)
  @TestData(":", TypeScriptColonNode)
  @TestData(",", TypeScriptCommaNode)
  @TestData(".", TypeScriptDotNode)
  @TestData("=", TypeScriptEqualsNode)
  @TestData("!", TypeScriptExclamationNode)
  @TestData(">", TypeScriptGreaterThanNode)
  @TestData("identifier", TypeScriptIdentifierNode)
  @TestData("if", TypeScriptIfKeywordNode)
  @TestData("\\u0061", TypeScriptIdentifierNode)
  @TestData("<", TypeScriptLessThanNode)
  @TestData("-", TypeScriptMinusNode)
  @TestData("`text`", TypeScriptNoSubstitutionTemplateLiteralNode)
  @TestData("42", TypeScriptNumericLiteralNode)
  @TestData(".5", TypeScriptNumericLiteralNode)
  @TestData("{", TypeScriptOpenBraceNode)
  @TestData("[", TypeScriptOpenBracketNode)
  @TestData("(", TypeScriptOpenParenthesisNode)
  @TestData("%", TypeScriptPercentNode)
  @TestData("+", TypeScriptPlusNode)
  @TestData("#value", TypeScriptPrivateIdentifierNode)
  @TestData("?", TypeScriptQuestionNode)
  @TestData(";", TypeScriptSemicolonNode)
  @TestData("/", TypeScriptSlashNode)
  @TestData("\"text\"", TypeScriptStringLiteralNode)
  @TestData("'text'", TypeScriptStringLiteralNode)
  @TestData("~", TypeScriptTildeNode)
  @TestMethod
  public routesEveryTokenFamily(sourceText: string, expectedType: Function & NodeType): void {
    const lexer = this.createLexer(sourceText);
    const node = lexer.lex();

    Assert.isInstanceOf(node, expectedType);
    Assert.areEqual(sourceText.length, lexer.reader.currentOffset);
  }

  @TestMethod
  public attachesLeadingTriviaToTokensAndEndOfFile(): void {
    const tokenLexer = this.createLexer(" /* comment */ \nvalue");
    const endLexer = this.createLexer(" \n");

    const token = tokenLexer.lex();
    const end = endLexer.lex();

    Assert.isInstanceOf(token, TypeScriptIdentifierNode);
    Assert.isInstanceOf(token.leadingTrivia, TypeScriptTriviaNode);
    Assert.isInstanceOf(end, EndOfFileNode);
    Assert.isDefined(end.leadingTrivia);
  }

  @TestMethod
  public returnsEndOfFileForEmptyInput(): void {
    const lexer = this.createLexer(String.empty);

    const node = lexer.lex();

    Assert.isInstanceOf(node, EndOfFileNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(0, node.span.length);
  }

  @TestData("x.5y", 1, TypeScriptDotNode, 1)
  @TestData("x.5y", 2, TypeScriptNumericLiteralNode, 2)
  @TestData("x...y", 1, TypeScriptDotNode, 1)
  @TestData("x...y", 2, TypeScriptDotNode, 1)
  @TestData("x...y", 3, TypeScriptDotDotDotNode, 3)
  @TestData("x.name", 4, TypeScriptDotNode, 1)
  @TestData("x.\u0661y", 2, TypeScriptDotNode, 1)
  @TestData("x42y", 2, TypeScriptNumericLiteralNode, 2)
  @TestMethod
  public distinguishesDecimalDotsFromPunctuationWithinReaderBounds(
    content: string,
    length: number,
    expectedType: Function & NodeType,
    consumedLength: number): void {
    const reader = new SourceReader(new Source(content), new SourceSpan(1, length));
    const lexer = TypeScriptLexerFixture.create(reader);
    const node = lexer.lex();

    Assert.isInstanceOf(node, expectedType);
    Assert.areEqual(1, node.span.startOffset);
    Assert.areEqual(consumedLength, node.span.length);
    Assert.areEqual(1 + consumedLength, reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public returnsInvalidCharactersWithoutSkippingFollowingTokens(): void {
    const lexer = this.createLexer("§name");

    const unknown = lexer.lex();
    const identifier = lexer.lex();

    Assert.isInstanceOf(unknown, TypeScriptUnknownNode);
    Assert.areEqual("§", unknown.value);
    Assert.isInstanceOf(identifier, TypeScriptIdentifierNode);
    Assert.areEqual("name", identifier.value);
    Assert.areEqual("TS1127@0:1", TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public readsSequentialTokens(): void {
    const lexer = this.createLexer("name + 1;");

    Assert.isInstanceOf(lexer.lex(), TypeScriptIdentifierNode);
    Assert.isInstanceOf(lexer.lex(), TypeScriptPlusNode);
    Assert.isInstanceOf(lexer.lex(), TypeScriptNumericLiteralNode);
    Assert.isInstanceOf(lexer.lex(), TypeScriptSemicolonNode);
    Assert.isInstanceOf(lexer.lex(), EndOfFileNode);
  }

  private createLexer(content: string): TypeScriptLexer {
    return TypeScriptLexerFixture.create(new Source(content, "source.ts"));
  }
}
