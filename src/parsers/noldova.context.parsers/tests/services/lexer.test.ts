/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticCollector, LiteralNode, ParserException, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { BracketLexer } from "../fixtures/bracket.lexer.js";
import { CharacterLexer } from "../fixtures/character.lexer.js";
import { LiteralNodeFixture } from "../fixtures/literal-node.fixture.js";
import { MisplacedEndOfFileLexer } from "../fixtures/misplaced-end-of-file.lexer.js";
import { NonTerminatingLexer } from "../fixtures/non-terminating.lexer.js";
import { PrematureEndOfFileLexer } from "../fixtures/premature-end-of-file.lexer.js";
import { RewindingCharacterLexer } from "../fixtures/rewinding-character.lexer.js";

@TestClass
export class LexerTests {
  @TestMethod
  public readsACompleteSourceFromItsStart(): void {
    const source = new Source("prefix body suffix");
    const collector = new DiagnosticCollector(source);

    const lexer = new CharacterLexer(source, collector);

    Assert.areEqual(source, lexer.reader.source);
    Assert.areEqual(0, lexer.reader.currentOffset);
    Assert.areEqual(source.length, lexer.reader.endOffset);
    Assert.areEqual(collector, lexer.diagnosticCollector);
  }

  @TestMethod
  public sharesACallersReaderWithoutMovingIt(): void {
    const source = new Source("prefix body suffix");
    const reader = new SourceReader(source, new SourceSpan(7, 4));
    reader.advance();

    const lexer = new CharacterLexer(reader, new DiagnosticCollector(source));

    Assert.areEqual(reader, lexer.reader);
    Assert.areEqual(8, lexer.reader.currentOffset);
    Assert.areEqual(11, lexer.reader.endOffset);
  }

  @TestMethod
  public producesEachNodeInSourceOrder(): void {
    const lexer = this.createLexer("ab");

    const first = lexer.lex();
    const second = lexer.lex();
    const end = lexer.lex();

    Assert.isInstanceOf(first, LiteralNode);
    Assert.isInstanceOf(second, LiteralNode);
    Assert.areEqual("a", first.value);
    Assert.areEqual("b", second.value);
    Assert.areEqual(0, first.span.startOffset);
    Assert.areEqual(1, second.span.startOffset);
    Assert.isTrue(end.span.isEmpty);
    Assert.areEqual(2, lexer.reader.currentOffset);
  }

  @TestMethod
  public reportsLexicalDiagnosticsToTheSuppliedCollector(): void {
    const lexer = this.createLexer("ab", true);

    lexer.lex();
    lexer.lex();

    Assert.areEqual(2, lexer.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, lexer.diagnosticCollector.diagnostics[0]?.location?.start);
    Assert.areEqual(1, lexer.diagnosticCollector.diagnostics[1]?.location?.start);
  }

  @TestMethod
  public rejectsAnEndMarkerBeforeTheReaderEnd(): void {
    const source = new Source("ab");

    Assert.throws(() => new PrematureEndOfFileLexer(source, new DiagnosticCollector(source)).lex(), ParserException);
  }

  @TestMethod
  public rejectsAnEndMarkerAwayFromTheReaderPosition(): void {
    const source = new Source("ab");

    Assert.throws(() => new MisplacedEndOfFileLexer(source, new DiagnosticCollector(source)).lex(), ParserException);
  }

  @TestMethod
  public rejectsALexThatDoesNotAdvance(): void {
    const source = new Source("ab");
    const lexer = new RewindingCharacterLexer(source, new DiagnosticCollector(source));

    lexer.lex();

    Assert.throws(() => lexer.lex(), ParserException);
  }

  @TestMethod
  public requiresAnEndMarkerAtTheSourceEnd(): void {
    const source = new Source(String.empty);

    Assert.throws(() => new NonTerminatingLexer(source, new DiagnosticCollector(source)).lex(), ParserException);
  }

  @TestMethod
  public appliesTheSameInvariantsToAReplacementLex(): void {
    const lexer = this.createLexer("ab");

    const replacement = lexer.reLex(() => {
      lexer.reader.advance();
      return new LiteralNodeFixture("replacement", new SourceSpan(0, 1));
    });

    Assert.isInstanceOf(replacement, LiteralNode);
    Assert.areEqual("replacement", replacement.value);
    Assert.throws(() => lexer.reLex(() => new LiteralNodeFixture("stationary", new SourceSpan(1, 1))), ParserException);
  }

  @TestMethod
  public carriesADerivedLexersModeBetweenNodes(): void {
    const source = new Source("[a]");
    const lexer = new BracketLexer(source, new DiagnosticCollector(source));

    lexer.lex();
    const inner = lexer.lex();
    Assert.areEqual(1, lexer.depth);
    lexer.lex();

    Assert.isInstanceOf(inner, LiteralNode);
    Assert.areEqual("1:a", inner.value);
    Assert.areEqual(0, lexer.depth);
  }

  private createLexer(text: string, addDiagnostics: boolean = false): CharacterLexer {
    const source = new Source(text);

    return new CharacterLexer(source, new DiagnosticCollector(source), addDiagnostics);
  }
}
