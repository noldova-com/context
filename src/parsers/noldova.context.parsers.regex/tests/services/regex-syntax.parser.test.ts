/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  RegexAlternativeNode,
  RegexCapturingGroupNode,
  RegexCharacterClassNode,
  RegexCharacterNode,
  RegexDigitEscapeNode,
  RegexDotNode,
  RegexHexEscapeNode,
  RegexNamedCapturingGroupNode
} from "@noldova/context.parsers.regex";
import { RegexParserContext } from "@noldova/context.parsers.regex/models/regex-parser-context.js";
import { RegexLexer } from "@noldova/context.parsers.regex/services/lexers/regex.lexer.js";
import { RegexSyntaxParser } from "@noldova/context.parsers.regex/services/regex-syntax.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexSyntaxParserTests {
  @TestMethod
  public parsesEveryAtomCategory(): void {
    const alternative = RegexParserFixture.parseFirstAlternative("a.\\d[b](c)");

    Assert.isInstanceOf(alternative.children[0], RegexCharacterNode);
    Assert.isInstanceOf(alternative.children[1], RegexDotNode);
    Assert.isInstanceOf(alternative.children[2], RegexDigitEscapeNode);
    Assert.isInstanceOf(alternative.children[3], RegexCharacterClassNode);
    Assert.isInstanceOf(alternative.children[4], RegexCapturingGroupNode);
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public preservesLiteralPunctuationAndEscapeSemantics(flags: string): void {
    const alternative = RegexParserFixture.parseFirstAlternative(":,=!-<>\\d\\x41", flags);

    for (let index = 0; index < 7; index++) {
      const node = alternative.children[index];
      Assert.isInstanceOf(node, RegexCharacterNode);
      Assert.areEqual(":,=!-<>".charAt(index), node.value);
    }

    Assert.isInstanceOf(alternative.children[7], RegexDigitEscapeNode);
    Assert.isInstanceOf(alternative.children[8], RegexHexEscapeNode);
    Assert.areEqual(9, alternative.children.length);
  }

  @TestMethod
  @TestData("]", "u", "CTX1033")
  @TestData("]", "v", "CTX1033")
  @TestData("}", "u", "CTX1033")
  @TestData("}", "v", "CTX1033")
  @TestData("{", "u", "CTX1011")
  @TestData("{", "v", "CTX1011")
  public rejectedUnicodePunctuationReportsADiagnosticAndRecovers(punctuation: string, flags: string, code: string): void {
    const result = RegexParserFixture.parse(punctuation + "a", flags);
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
    Assert.isInstanceOf(alternative.children[1], RegexCharacterNode);
    Assert.areEqual("a", alternative.children[1].value);
  }

  @TestMethod
  @TestData("]")
  @TestData("}")
  @TestData("{")
  public acceptsLegacyPunctuationAsLiteralCharacters(punctuation: string): void {
    const result = RegexParserFixture.parse(punctuation + "a");
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);

    Assert.areEqual(0, result.diagnostics.length);
    Assert.isInstanceOf(alternative.children[0], RegexCharacterNode);
    Assert.areEqual(punctuation, alternative.children[0].value);
    Assert.isInstanceOf(alternative.children[1], RegexCharacterNode);
    Assert.areEqual("a", alternative.children[1].value);
  }
  @TestMethod
  @TestData("!", "!")
  @TestData("#", "#")
  @TestData("!", "x")
  public doesNotReadReservedPunctuationBeyondThePatternRegion(character: string, gap: string): void {
    const source = new Source("[" + character + gap + "v");
    const context = new RegexParserContext(source);
    const lexer = new RegexLexer(source, new SourceSpan(0, 2), new SourceSpan(3, 1), new SourceSpan(0, 4), context.diagnosticCollector);
    const result = new RegexSyntaxParser(context, lexer).parse();

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1004", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(2, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
    Assert.areEqual(2, lexer.reader.currentOffset);
    Assert.areEqual("[" + character, result.rootNode.patternNode.value);
  }

  @TestMethod
  @TestData("(?<\\u{61}>a)", "")
  @TestData("(?<\\u{61}>a)", "u")
  @TestData("(?<\\u0061>a)", "")
  public lookAheadPreservesEscapedGroupNames(pattern: string, flags: string): void {
    const source = new Source(pattern + flags);
    const context = new RegexParserContext(source);
    const lexer = new RegexLexer(source, new SourceSpan(0, pattern.length), new SourceSpan(pattern.length, flags.length), new SourceSpan(0, source.length), context.diagnosticCollector);
    const parser = new RegexSyntaxParser(context, lexer);

    parser.lookAhead(() => {
      parser.advance();
      parser.advance();
      parser.advance();
      return false;
    });

    const result = parser.parse();
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    const group = alternative.children[0];
    Assert.isInstanceOf(group, RegexNamedCapturingGroupNode);
    Assert.areEqual("a", group.groupName);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public parsesACompletePatternAndConsumesTheSharedStream(): void {
    const source = new Source("a|b", "pattern.regex");
    const reader = new SourceReader(source);
    const context = new RegexParserContext(source);
    const parser = new RegexSyntaxParser(context, new RegexLexer(reader, new SourceSpan(3, 0), new SourceSpan(0, 3), context.diagnosticCollector));

    const result = parser.parse();

    Assert.areEqual("a|b", result.rootNode.patternNode.value);
    Assert.areEqual(2, result.rootNode.patternNode.disjunctionNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public preservesTheAbsoluteSpanOfABoundedReader(): void {
    const source = new Source("prefixabcpostfix", "source.ts");
    const reader = new SourceReader(source, new SourceSpan(6, 3));
    const context = new RegexParserContext(source);
    const lexer = new RegexLexer(reader, new SourceSpan(9, 0), new SourceSpan(6, 3), context.diagnosticCollector);

    const result = new RegexSyntaxParser(context, lexer).parse();

    Assert.areEqual("abc", result.rootNode.patternNode.value);
    Assert.areEqual(6, result.rootNode.patternNode.span.startOffset);
    Assert.areEqual(3, result.rootNode.patternNode.span.length);
  }

  @TestMethod
  public returnsTheCompleteRootWithPatternFlagsAndRawValue(): void {
    const source = new Source("/abc/gi", "expression.ts");
    const context = new RegexParserContext(source);
    const lexer = new RegexLexer(source, new SourceSpan(1, 3), new SourceSpan(5, 2), new SourceSpan(0, 7), context.diagnosticCollector);

    const result = new RegexSyntaxParser(context, lexer).parse();

    Assert.areEqual("/abc/gi", result.rootNode.rawValue);
    Assert.areEqual("abc", result.rootNode.patternNode.value);
    Assert.areEqual("gi", result.rootNode.flagsNode.value);
    Assert.isTrue(result.rootNode.flagsNode.global);
    Assert.isTrue(result.rootNode.flagsNode.ignoreCase);
    Assert.areEqual(0, result.diagnostics.length);
  }
}
