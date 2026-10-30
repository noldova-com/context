/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCategory, DiagnosticCode, DiagnosticTemplate } from "@noldova/context.diagnostics";
import { DiagnosticCollector, EndOfFileNode, LiteralNode, ParserContext, ParserException, Source, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CharacterLexer } from "../fixtures/character.lexer.js";
import { CharacterParser } from "../fixtures/character.parser.js";
import { LiteralNodeFixture } from "../fixtures/literal-node.fixture.js";

@TestClass
export class ParserTests {
  private static readonly GRAMMAR_TEMPLATE: DiagnosticTemplate = new DiagnosticTemplate(
    new DiagnosticCode(DiagnosticAuthority.context, 2), DiagnosticCategory.Error, "Grammar diagnostic.");

  @TestMethod
  public lexesItsFirstNodeWhenTheSessionStarts(): void {
    const parser = CharacterParser.create("ab");

    Assert.areEqual(1, parser.characterLexer.lexCount);
    Assert.areEqual("a", parser.requireCurrentNode(LiteralNode).value);
    Assert.isFalse(parser.isEndOfFile);
  }

  @TestMethod
  public requiresTheLexerToReportToTheContextCollector(): void {
    const source = new Source("a");
    const context = new ParserContext(source);
    const lexer = new CharacterLexer(source, new DiagnosticCollector(source));

    Assert.throws(() => new CharacterParser(context, lexer), ParserException);
  }

  @TestMethod
  public publishesTheRootNodeWithItsDiagnostics(): void {
    const parser = CharacterParser.create("a", true);

    const result = parser.parse();

    Assert.areEqual("a", result.rootNode.value);
    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
    Assert.areEqual(0, result.diagnostics[1]?.location?.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public refusesASecondParse(): void {
    const parser = CharacterParser.create("a");
    parser.parse();

    Assert.throws(() => parser.parse(), ParserException);
  }

  @TestMethod
  public refusesToPublishWhileInputRemains(): void {
    const parser = CharacterParser.create("ab");

    Assert.throws(() => parser.parse(), ParserException);
  }

  @TestMethod
  public staysOnTheEndMarkerWhenAdvancingPastIt(): void {
    const parser = CharacterParser.create("a");
    parser.advance();
    const end = parser.currentNode;
    const lexCount = parser.characterLexer.lexCount;

    parser.advance();

    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(end, parser.currentNode);
    Assert.areEqual(lexCount, parser.characterLexer.lexCount);
  }

  @TestMethod
  public reportsLexicalDiagnosticsAsNodesAreLexed(): void {
    const parser = CharacterParser.create("ab", true);
    const collector = parser.context.diagnosticCollector;
    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(0, collector.diagnostics[0]?.location?.start);

    parser.advance();

    Assert.areEqual(2, collector.diagnostics.length);
    Assert.areEqual(1, collector.diagnostics[1]?.location?.start);
  }

  @TestMethod
  public consumesOnlyAMatchingNodeType(): void {
    const parser = CharacterParser.create("ab");

    Assert.isUndefined(parser.tryConsume(EndOfFileNode));
    Assert.areEqual("a", parser.requireCurrentNode(LiteralNode).value);
    const consumed = parser.tryConsume(LiteralNode);

    Assert.isDefined(consumed);
    Assert.areEqual("a", consumed.value);
    Assert.areEqual("b", parser.requireCurrentNode(LiteralNode).value);
  }

  @TestMethod
  public rejectsARequiredTypeTheCurrentNodeDoesNotHave(): void {
    const parser = CharacterParser.create("a");

    Assert.throws(() => parser.requireCurrentNode(EndOfFileNode), ParserException);
  }

  @TestMethod
  public rewindsAfterALookahead(): void {
    const parser = CharacterParser.create("abc", true);
    const reader = parser.characterLexer.reader;
    const node = parser.currentNode;
    const offset = reader.currentOffset;

    const recognized = parser.lookAhead(() => {
      parser.advance();
      parser.advance();
      return parser.requireCurrentNode(LiteralNode).value === "c";
    });

    Assert.isTrue(recognized);
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, reader.currentOffset);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    parser.advance();
    Assert.areEqual(2, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics[1]?.location?.start);
  }

  @TestMethod
  public rewindsWhenALookaheadThrows(): void {
    const parser = CharacterParser.create("abc", true);
    const reader = parser.characterLexer.reader;
    const node = parser.currentNode;
    const offset = reader.currentOffset;

    Assert.throws(() => parser.lookAhead(() => {
      parser.advance();
      throw new ParserException("The lookahead failed.");
    }), ParserException);

    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, reader.currentOffset);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public keepsTheWorkOfAnAcceptedAttempt(): void {
    const parser = CharacterParser.create("ab", true);

    const accepted = parser.tryParse(() => {
      parser.advance();
      return parser.requireCurrentNode(LiteralNode);
    });

    Assert.isDefined(accepted);
    Assert.areEqual("b", accepted.value);
    Assert.areEqual("b", parser.requireCurrentNode(LiteralNode).value);
    Assert.areEqual(2, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public acceptsAResultThatIsNull(): void {
    const parser = CharacterParser.create("ab");

    const accepted = parser.tryParse(() => {
      parser.advance();
      return null;
    });

    Assert.isNull(accepted);
    Assert.areEqual("b", parser.requireCurrentNode(LiteralNode).value);
  }

  @TestMethod
  public rewindsARejectedAttempt(): void {
    const parser = CharacterParser.create("abc", true);
    const reader = parser.characterLexer.reader;
    const node = parser.currentNode;
    const offset = reader.currentOffset;

    const rejected = parser.tryParse(() => {
      parser.advance();
      return undefined;
    });

    Assert.isUndefined(rejected);
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, reader.currentOffset);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public rewindsWhenAnAttemptThrows(): void {
    const parser = CharacterParser.create("abc");
    const node = parser.currentNode;

    Assert.throws(() => parser.tryParse(() => {
      parser.advance();
      throw new ParserException("The attempt failed.");
    }), ParserException);

    Assert.areEqual(node, parser.currentNode);
  }

  @TestMethod
  public keepsReportedDiagnosticsWhenRelexing(): void {
    const parser = CharacterParser.create("ab", true);
    const collector = parser.context.diagnosticCollector;
    const lexical = collector.diagnostics[0];

    parser.reLex(() => {
      parser.characterLexer.reader.advance();
      return new LiteralNodeFixture("replacement", new SourceSpan(0, 1));
    });

    Assert.areEqual("replacement", parser.requireCurrentNode(LiteralNode).value);
    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(lexical, collector.diagnostics[0]);
    parser.advance();
    Assert.areEqual(2, collector.diagnostics.length);
    Assert.areEqual("b", parser.requireCurrentNode(LiteralNode).value);
  }

  @TestMethod
  public reportsTheReplacementNodesDiagnosticsAsTheyAreLexed(): void {
    const parser = CharacterParser.create("ab");
    const collector = parser.context.diagnosticCollector;

    parser.reLex(() => {
      parser.characterLexer.reader.advance();
      parser.characterLexer.diagnosticCollector.add(ParserTests.GRAMMAR_TEMPLATE, new SourceSpan(0, 1));
      return new LiteralNodeFixture("replacement", new SourceSpan(0, 1));
    });

    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual("Grammar diagnostic.", collector.diagnostics[0]?.message.text);
  }

  @TestMethod
  public keepsGrammarDiagnosticsReportedWhileTheReplacedNodeWasCurrent(): void {
    const parser = CharacterParser.create("ab");
    const collector = parser.context.diagnosticCollector;
    collector.add(ParserTests.GRAMMAR_TEMPLATE, new SourceSpan(0, 1));
    const grammar = collector.diagnostics[0];

    parser.reLex(() => {
      parser.characterLexer.reader.advance();
      return new LiteralNodeFixture("replacement", new SourceSpan(0, 1));
    });
    parser.advance();

    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(grammar, collector.diagnostics[0]);
  }

  @TestMethod
  public rewindsExactlyAcrossARelexInsideALookahead(): void {
    const parser = CharacterParser.create("ab", true);
    const collector = parser.context.diagnosticCollector;
    const node = parser.currentNode;
    const lexical = collector.diagnostics[0];

    parser.lookAhead(() => {
      collector.add(ParserTests.GRAMMAR_TEMPLATE, new SourceSpan(0, 1));
      parser.reLex(() => {
        parser.characterLexer.reader.advance();
        parser.characterLexer.diagnosticCollector.add(ParserTests.GRAMMAR_TEMPLATE, new SourceSpan(0, 1));
        return new LiteralNodeFixture("replacement", new SourceSpan(0, 1));
      });
      parser.advance();
      return collector.diagnostics.length === 4;
    });

    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(1, collector.diagnostics.length);
    Assert.areEqual(lexical, collector.diagnostics[0]);
    parser.advance();
    Assert.areEqual(2, collector.diagnostics.length);
    Assert.areEqual("Character diagnostic.", collector.diagnostics[1]?.message.text);
  }
}
