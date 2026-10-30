/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { DiagnosticCollector, Lexer, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  RegexAlternativeNode,
  RegexCharacterClassNode,
  RegexCharacterNode,
  RegexClassIntersectionNode,
  RegexClassSubtractionNode,
  RegexClassUnionNode,
  RegexDigitEscapeNode,
  RegexDotNode,
  RegexEndAssertionNode,
  RegexQuantifierNode,
  RegexStartAssertionNode
} from "@noldova/context.parsers.regex";
import { RegexLexer } from "@noldova/context.parsers.regex/services/lexers/regex.lexer.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexLexerTests {
  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public indexesDecodedNamesWithoutChangingCaptureCount(flags: string): void {
    const lexer = this.createLexer(flags, "(?<na\\u006de>a)|(?<name>b)|(c)");

    Assert.areEqual(3, lexer.capturingGroupCount);
    Assert.isTrue(lexer.hasNamedCapturingGroups);
    Assert.isTrue(lexer.hasNamedCapturingGroup("name"));
    Assert.isFalse(lexer.hasNamedCapturingGroup("na\\u006de"));
    Assert.isFalse(lexer.hasNamedCapturingGroup("Name"));
    Assert.isFalse(lexer.hasNamedCapturingGroup("missing"));
    Assert.areEqual(0, lexer.reader.currentOffset);
  }

  @TestMethod
  public constructorPreservesInputAndFlags(): void {
    const lexer = this.createLexer("u", "(?<name>a)(b)");

    Assert.areEqual("(?<name>a)(b)u", lexer.reader.source.content);
    Assert.areEqual("u", lexer.flagsNode.value);
    Assert.areEqual(14, lexer.inputSpan.length);
    Assert.isInstanceOf(lexer, Lexer);
  }

  @TestMethod
  public constructorReusesAReaderAtItsRegionStart(): void {
    const source = new Source("pattern", "pattern.regex");
    const reader = new SourceReader(source, new SourceSpan(2, 3));
    const lexer = new RegexLexer(reader, new SourceSpan(5, 0), new SourceSpan(2, 3), new DiagnosticCollector(source));

    Assert.areEqual(source, lexer.reader.source);
    Assert.areEqual(reader, lexer.reader);
    Assert.areEqual(2, lexer.reader.currentOffset);
  }

  @TestMethod
  public constructorRejectsInvalidInputRelationships(): void {
    const source = new Source("patternflags", "expression.ts");
    const pattern = new SourceSpan(0, 7);
    const flags = new SourceSpan(7, 5);
    const complete = new SourceSpan(0, 12);
    const collector = new DiagnosticCollector(source);

    Assert.throws(() => new RegexLexer(new Source("pattern", String.empty), pattern, new SourceSpan(7, 0), pattern, collector), ArgumentException);
    Assert.throws(() => new RegexLexer(source, pattern, new SourceSpan(6, 1), complete, collector), ArgumentException);
    Assert.throws(() => new RegexLexer(source, pattern, flags, new SourceSpan(0, 10), collector), ArgumentException);
    const reader = new SourceReader(source, new SourceSpan(4, 3));
    Assert.throws(() => new RegexLexer(reader, new SourceSpan(7, 0), new SourceSpan(5, 2), collector), ArgumentException);

    const advancedReader = new SourceReader(source, pattern);
    advancedReader.advance();
    Assert.throws(() => new RegexLexer(advancedReader, flags, complete, collector), ArgumentException);
  }

  @TestMethod
  public lexesAssertionsWildcardEscapesAndCharacters(): void {
    const children = RegexParserFixture.parseFirstAlternative("^$.\\da", "u").children;

    Assert.isInstanceOf(children[0], RegexStartAssertionNode);
    Assert.isInstanceOf(children[1], RegexEndAssertionNode);
    Assert.isInstanceOf(children[2], RegexDotNode);
    Assert.isInstanceOf(children[3], RegexDigitEscapeNode);
    Assert.isInstanceOf(children[4], RegexCharacterNode);
  }

  @TestMethod
  public lexesPatternCharactersAsQuantifiableAtoms(): void {
    for (const pattern of ["-*", ":+", ",?", "=*", "!*", ">+", "<?", "]*", "{+", "}?"]) {
      const result = RegexParserFixture.parse(pattern);
      const alternative = result.rootNode.patternNode.disjunctionNode.children[0];

      Assert.areEqual(0, result.diagnostics.length);
      Assert.isInstanceOf(alternative, RegexAlternativeNode);
      Assert.isInstanceOf(alternative.children[0], RegexCharacterNode);
      Assert.isInstanceOf(alternative.children[1], RegexQuantifierNode);
    }
  }

  @TestMethod
  public lexesClassicCharacterClassContentAsCharacters(): void {
    const characterClass = RegexParserFixture.parseFirstAlternative("[(:=,!<>]").children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.isInstanceOf(characterClass.expressionNode, RegexClassUnionNode);

    for (const child of characterClass.expressionNode.children)
      Assert.isInstanceOf(child, RegexCharacterNode);
  }

  @TestMethod
  public lexesUnicodeSetOperators(): void {
    const intersection = RegexParserFixture.parseFirstAlternative("[a&&b]", "v").children[0];
    const subtraction = RegexParserFixture.parseFirstAlternative("[a--b]", "v").children[0];
    Assert.isInstanceOf(intersection, RegexCharacterClassNode);
    Assert.isInstanceOf(subtraction, RegexCharacterClassNode);

    Assert.isInstanceOf(intersection.expressionNode, RegexClassIntersectionNode);
    Assert.isInstanceOf(subtraction.expressionNode, RegexClassSubtractionNode);
  }

  @TestMethod
  public lexesEmptyPatternWithoutProducingTerms(): void {
    const result = RegexParserFixture.parse(String.empty);
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];

    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    Assert.areEqual(0, alternative.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  private createLexer(flagsValue: string, pattern: string = String.empty): RegexLexer {
    const source = new Source(pattern + flagsValue, "pattern.regex");
    return new RegexLexer(
      source,
      new SourceSpan(0, pattern.length),
      new SourceSpan(pattern.length, flagsValue.length),
      new SourceSpan(0, pattern.length + flagsValue.length),
      new DiagnosticCollector(source));
  }
}
