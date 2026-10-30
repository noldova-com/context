/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory } from "@noldova/context.diagnostics";
import { CommentNode, type Node, type NodeType, Source, SourceReader, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptBlockCommentNode,
  TypeScriptConflictMarkerNode,
  TypeScriptLineCommentNode,
  TypeScriptShebangNode,
  TypeScriptTriviaNode
} from "@noldova/context.parsers.typescript";
import { TriviaLexer } from "@noldova/context.parsers.typescript/services/lexers/trivia.lexer.js";
import type { TypeScriptLexer } from "@noldova/context.parsers.typescript/services/lexers/typescript.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptLexerFixture } from "../../fixtures/typescript-lexer.fixture.js";

@TestClass
export class TriviaLexerTests {
  @TestMethod
  public returnsUndefinedAtEndOfFile(): void {
    const lexer = this.createLexer(String.empty);

    Assert.isUndefined(this.lexLeadingTrivia(lexer));
    Assert.areEqual(0, lexer.reader.currentOffset);
  }

  @TestMethod
  public returnsUndefinedBeforeANonTriviaCharacter(): void {
    const lexer = this.createLexer("value");

    Assert.isUndefined(this.lexLeadingTrivia(lexer));
  }

  @TestMethod
  public readsAShebangOnlyAtTheStartOfTheSource(): void {
    const lexer = this.createLexer("#!/usr/bin/env node");
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptShebangNode);
    Assert.areEqual("#!/usr/bin/env node", trivia.value);
    Assert.areEqual(0, trivia.span.startOffset);
    Assert.areEqual(19, trivia.span.length);
    Assert.areEqual(19, lexer.reader.currentOffset);
  }

  @TestMethod
  public combinesAShebangWithItsFollowingLineBreak(): void {
    const lexer = this.createLexer("#!/usr/bin/env node\nvalue");
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptTriviaNode);
    Assert.areEqual(2, trivia.children.length);
    Assert.isInstanceOf(trivia.children[0], TypeScriptShebangNode);
    Assert.isInstanceOf(trivia.children[1], WhitespaceNode);
    Assert.areEqual(20, trivia.span.endOffset);
  }

  @TestMethod
  public doesNotTreatAMisplacedShebangAsTrivia(): void {
    const lexer = this.createLexer("x\n#!/usr/bin/env node");
    lexer.reader.seek(2);

    Assert.isUndefined(this.lexLeadingTrivia(lexer));
    Assert.areEqual(3, lexer.reader.currentOffset);
  }

  @TestMethod
  public readsOpeningAndClosingConflictMarkers(): void {
    const openingLexer = this.createLexer("<<<<<<< HEAD\nvalue");
    const openingTrivia = this.lexLeadingTrivia(openingLexer);
    const closingLexer = this.createLexer(">>>>>>> branch\nvalue");
    const closingTrivia = this.lexLeadingTrivia(closingLexer);

    Assert.isInstanceOf(openingTrivia, TypeScriptTriviaNode);
    Assert.isInstanceOf(openingTrivia.children[0], TypeScriptConflictMarkerNode);
    Assert.areEqual("<<<<<<< HEAD", openingTrivia.children[0].value);
    Assert.areEqual(13, openingTrivia.span.endOffset);
    Assert.isInstanceOf(closingTrivia, TypeScriptTriviaNode);
    Assert.isInstanceOf(closingTrivia.children[0], TypeScriptConflictMarkerNode);
    Assert.areEqual(">>>>>>> branch", closingTrivia.children[0].value);
    Assert.areEqual(15, closingTrivia.span.endOffset);
  }

  @TestMethod
  public readsSeparatorAndAncestorConflictSections(): void {
    const value = "||||||| ancestor\ncommon\n=======\ncurrent\n>>>>>>> branch";
    const lexer = this.createLexer(value);
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptTriviaNode);
    Assert.areEqual(3, trivia.children.length);
    Assert.isInstanceOf(trivia.children[0], TypeScriptConflictMarkerNode);
    Assert.isInstanceOf(trivia.children[1], TypeScriptConflictMarkerNode);
    Assert.isInstanceOf(trivia.children[2], TypeScriptConflictMarkerNode);
    Assert.areEqual("||||||| ancestor\ncommon\n", trivia.children[0].value);
    Assert.areEqual("=======\ncurrent\n", trivia.children[1].value);
    Assert.areEqual(">>>>>>> branch", trivia.children[2].value);
    Assert.areEqual(value.length, trivia.span.endOffset);
    Assert.areEqual("TS1185@0:7|TS1185@24:7|TS1185@40:7", TypeScriptDiagnosticsFixture.project(lexer.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsTS1185ForAConflictMarker(): void {
    const lexer = this.createLexer("<<<<<<< HEAD");
    this.lexLeadingTrivia(lexer);

    Assert.areEqual(1, lexer.diagnosticCollector.diagnostics.length);
    const diagnostic = lexer.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual(DiagnosticAuthority.typeScript, diagnostic.code.authority);
    Assert.areEqual(1185, diagnostic.code.value);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("Merge conflict marker encountered.", diagnostic.message.text);
    Assert.isDefined(diagnostic.location);
    Assert.areEqual(0, diagnostic.location.start);
    Assert.areEqual(7, diagnostic.location.length);
  }

  @TestMethod
  public rejectsTextThatOnlyResemblesAConflictMarker(): void {
    const withinLine = this.createLexer("x<<<<<<< HEAD");
    withinLine.reader.seek(1);
    const missingSpace = this.createLexer("<<<<<<<HEAD");
    const markerAtEnd = this.createLexer("<<<<<<<");

    Assert.isUndefined(this.lexLeadingTrivia(withinLine));
    Assert.isUndefined(this.lexLeadingTrivia(missingSpace));
    Assert.isUndefined(this.lexLeadingTrivia(markerAtEnd));
    Assert.areEqual(3, withinLine.reader.currentOffset);
    Assert.areEqual(2, missingSpace.reader.currentOffset);
    Assert.areEqual(2, markerAtEnd.reader.currentOffset);
  }

  @TestMethod
  public readsWhitespaceAndLineTerminatorsAsOneWhitespaceNode(): void {
    const value = " \t\v\f\u00A0\u0085\u1680\u2000\u200B\u202F\u205F\u3000\uFEFF\n\r\u2028\u2029";
    const lexer = this.createLexer(`${value}x`);
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, WhitespaceNode);
    Assert.areEqual(value, trivia.value);
    Assert.areEqual(0, trivia.span.startOffset);
    Assert.areEqual(value.length, trivia.span.length);
    Assert.areEqual(value.length, trivia.span.endOffset);
  }

  @TestData("//", "")
  @TestData("// comment", " comment")
  @TestData("// comment  ", " comment  ")
  @TestData("//// comment", "// comment")
  @TestData("/// <reference />", "/ <reference />")
  @TestData("//\uD83D\uDE00\0", "\uD83D\uDE00\0")
  @TestMethod
  public readsASingleLineComment(raw: string, body: string): void {
    const lexer = this.createLexer(raw);
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptLineCommentNode);
    Assert.isInstanceOf(trivia, CommentNode);
    Assert.areEqual(body, trivia.value);
    Assert.areEqual(0, trivia.span.startOffset);
    Assert.areEqual(raw.length, trivia.span.length);
    Assert.areEqual(raw, lexer.reader.source.getText(trivia.span));
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("\n")
  @TestData("\r")
  @TestData("\r\n")
  @TestData("\u2028")
  @TestData("\u2029")
  @TestMethod
  public stopsASingleLineCommentAtATypeScriptLineBreak(terminator: string): void {
    const lexer = this.createLexer(`// comment${terminator}value`);
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptTriviaNode);
    Assert.areEqual(2, trivia.children.length);
    const comment = trivia.children[0];
    const lineBreak = trivia.children[1];
    Assert.isInstanceOf(comment, TypeScriptLineCommentNode);
    Assert.isInstanceOf(lineBreak, WhitespaceNode);
    Assert.areEqual(" comment", comment.value);
    Assert.areEqual(10, comment.span.endOffset);
    Assert.areEqual("// comment", lexer.reader.source.getText(comment.span));
    Assert.areEqual(terminator, lineBreak.value);
    Assert.areEqual(10 + terminator.length, trivia.span.endOffset);
  }

  @TestData("/**/", "")
  @TestData("/***/", "*")
  @TestData("/* comment */", " comment ")
  @TestData("/** documentation */", "* documentation ")
  @TestData("/*\r\n * documentation\r\n */", "\r\n * documentation\r\n ")
  @TestData("/* \u2028\u2029 */", " \u2028\u2029 ")
  @TestData("/* outer /* inner */", " outer /* inner ")
  @TestData("/*\uD83D\uDE00\0*/", "\uD83D\uDE00\0")
  @TestMethod
  public readsATerminatedBlockComment(raw: string, body: string): void {
    const lexer = this.createLexer(`${raw}value`);
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptBlockCommentNode);
    Assert.isInstanceOf(trivia, CommentNode);
    Assert.areEqual(body, trivia.value);
    Assert.areEqual(raw.length, trivia.span.length);
    Assert.areEqual(raw, lexer.reader.source.getText(trivia.span));
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public combinesConsecutiveTriviaInSourceOrder(): void {
    const lexer = this.createLexer("  // comment\n/* block */value");
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptTriviaNode);
    Assert.areEqual(4, trivia.children.length);
    Assert.isInstanceOf(trivia.children[0], WhitespaceNode);
    Assert.isInstanceOf(trivia.children[1], TypeScriptLineCommentNode);
    Assert.isInstanceOf(trivia.children[2], WhitespaceNode);
    Assert.isInstanceOf(trivia.children[3], TypeScriptBlockCommentNode);
    Assert.areEqual(0, trivia.span.startOffset);
    Assert.areEqual(24, trivia.span.length);
    Assert.areEqual(24, trivia.span.endOffset);
  }

  @TestData("/*", "")
  @TestData("/*/", "/")
  @TestData("/* unterminated", " unterminated")
  @TestData("/* trailing*", " trailing*")
  @TestData("/*\r\n * note", "\r\n * note")
  @TestMethod
  public reportsTS1010AtEndOfAnUnterminatedBlockComment(raw: string, body: string): void {
    const lexer = this.createLexer(raw);
    const trivia = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(trivia, TypeScriptBlockCommentNode);
    Assert.areEqual(body, trivia.value);
    Assert.areEqual(0, trivia.span.startOffset);
    Assert.areEqual(raw.length, trivia.span.length);
    Assert.areEqual(raw, lexer.reader.source.getText(trivia.span));
    Assert.areEqual(1, lexer.diagnosticCollector.diagnostics.length);

    const diagnostic = lexer.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual(DiagnosticAuthority.typeScript, diagnostic.code.authority);
    Assert.areEqual(1010, diagnostic.code.value);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("'*/' expected.", diagnostic.message.text);
    Assert.isDefined(diagnostic.location);
    Assert.areEqual(raw.length, diagnostic.location.start);
    Assert.areEqual(0, diagnostic.location.length);
  }

  @TestMethod
  public doesNotClassifyASlashTokenAsTrivia(): void {
    const lexer = this.createLexer("/value");

    Assert.isUndefined(this.lexLeadingTrivia(lexer));
    Assert.areEqual(1, lexer.reader.currentOffset);
  }

  @TestData("// note", " note", TypeScriptLineCommentNode)
  @TestData("/* note */", " note ", TypeScriptBlockCommentNode)
  @TestMethod
  public preservesAbsoluteCommentSpansInABoundedReader(raw: string, body: string, expectedType: Function & NodeType): void {
    const source = new Source(`prefix${raw}suffix`);
    const reader = new SourceReader(source, new SourceSpan(6, raw.length));
    const lexer = TypeScriptLexerFixture.create(reader);
    const comment = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(comment, CommentNode);
    Assert.isInstanceOf(comment, expectedType);
    Assert.areEqual(body, comment.value);
    Assert.areEqual(6, comment.span.startOffset);
    Assert.areEqual(raw.length, comment.span.length);
    Assert.areEqual(raw, source.getText(comment.span));
    Assert.areEqual(6 + raw.length, reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData(2, "")
  @TestData(7, " note")
  @TestData(9, " note *")
  @TestMethod
  public doesNotUseAClosingDelimiterOutsideTheReaderRegion(length: number, body: string): void {
    const source = new Source("prefix/* note */suffix", "embedded.ts");
    const reader = new SourceReader(source, new SourceSpan(6, length));
    const lexer = TypeScriptLexerFixture.create(reader);
    const comment = this.lexLeadingTrivia(lexer);

    Assert.isInstanceOf(comment, TypeScriptBlockCommentNode);
    Assert.areEqual(body, comment.value);
    Assert.areEqual(6, comment.span.startOffset);
    Assert.areEqual(length, comment.span.length);
    Assert.areEqual(6 + length, reader.currentOffset);
    Assert.areEqual(1, lexer.diagnosticCollector.diagnostics.length);
    const diagnostic = lexer.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual(DiagnosticAuthority.typeScript, diagnostic.code.authority);
    Assert.areEqual(1010, diagnostic.code.value);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("'*/' expected.", diagnostic.message.text);
    Assert.areEqual("embedded.ts", diagnostic.location?.sourceIdentity);
    Assert.areEqual(6 + length, diagnostic.location?.start);
    Assert.areEqual(0, diagnostic.location?.length);
  }

  @TestData("")
  @TestData("value")
  @TestData("/")
  @TestData("*")
  @TestData("#")
  @TestData("\0")
  @TestData("😀")
  @TestData("\uD800")
  @TestMethod
  public leavesNonTriviaUnreadWithinTheReaderBoundary(content: string): void {
    const source = new Source("prefix" + content + " /*outside*/");
    const reader = new SourceReader(source, new SourceSpan(6, content.length));
    const lexer = TypeScriptLexerFixture.create(reader);

    Assert.isUndefined(new TriviaLexer().lex(lexer));
    Assert.areEqual(6, reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestData("//outside")
  @TestData("/*outside*/")
  @TestMethod
  public doesNotRecognizeACommentOpenerSplitByTheReaderEnd(content: string): void {
    const source = new Source("prefix" + content);
    const reader = new SourceReader(source, new SourceSpan(6, 1));
    const lexer = TypeScriptLexerFixture.create(reader);

    Assert.isUndefined(new TriviaLexer().lex(lexer));
    Assert.areEqual(6, reader.currentOffset);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public stopsWhitespaceAtTheReaderEndEvenWhenMoreFollows(): void {
    const source = new Source("prefix \t outside");
    const reader = new SourceReader(source, new SourceSpan(6, 2));
    const lexer = TypeScriptLexerFixture.create(reader);

    const node = new TriviaLexer().lex(lexer);

    Assert.isInstanceOf(node, WhitespaceNode);
    Assert.areEqual(" \t", node.value);
    Assert.areEqual(6, node.span.startOffset);
    Assert.areEqual(2, node.span.length);
    Assert.areEqual(8, reader.currentOffset);
  }

  @TestMethod
  public preservesMixedTriviaWithoutConsumingTheFollowingToken(): void {
    const source = new Source(" \t/*x*///y\r\nz");
    const lexer = TypeScriptLexerFixture.create(source);

    const node = new TriviaLexer().lex(lexer);

    Assert.isInstanceOf(node, TypeScriptTriviaNode);
    Assert.areEqual(4, node.children.length);
    Assert.isInstanceOf(node.children[0], WhitespaceNode);
    Assert.isInstanceOf(node.children[1], TypeScriptBlockCommentNode);
    Assert.isInstanceOf(node.children[2], TypeScriptLineCommentNode);
    Assert.isInstanceOf(node.children[3], WhitespaceNode);
    Assert.areEqual(" \t", node.children[0].value);
    Assert.areEqual("x", node.children[1].value);
    Assert.areEqual("y", node.children[2].value);
    Assert.areEqual("\r\n", node.children[3].value);
    Assert.areEqual(12, node.span.endOffset);
    Assert.areEqual(12, lexer.reader.currentOffset);
    Assert.areEqual("z", lexer.reader.peekCodeUnit());
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public keepsTriviaCollectionsLocalToEachLexingCall(): void {
    const lexer = new TriviaLexer();
    const firstLexer = TypeScriptLexerFixture.create(new Source(" "));
    const secondLexer = TypeScriptLexerFixture.create(new Source("/*x*/"));
    const emptyLexer = TypeScriptLexerFixture.create(new Source("value"));

    Assert.isInstanceOf(lexer.lex(firstLexer), WhitespaceNode);
    const comment = lexer.lex(secondLexer);
    Assert.isInstanceOf(comment, TypeScriptBlockCommentNode);
    Assert.areEqual("x", comment.value);
    Assert.isUndefined(lexer.lex(emptyLexer));
    Assert.areEqual(0, emptyLexer.reader.currentOffset);
  }

  private createLexer(content: string): TypeScriptLexer {
    return TypeScriptLexerFixture.create(new Source(content, "source.ts"));
  }

  private lexLeadingTrivia(lexer: TypeScriptLexer): Node | undefined {
    return lexer.lex().leadingTrivia;
  }
}
