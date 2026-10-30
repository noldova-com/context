/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { CompositeNode, ParserException, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexCharacterClassNode, RegexIdentityEscapeNode, RegexParser, RegexQuantifierNode, RegexUnknownNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexParserTests {
  @TestMethod
  public preservesThePublishedResultWhenSessionReuseIsRejected(): void {
    const parser = new RegexParser("a+");
    const result = parser.parse();

    const failure = Assert.throws(() => parser.parse(), ParserException);

    Assert.areEqual("The parser session has already been used.", failure.message);
    Assert.areEqual("a+", result.rootNode.patternNode.value);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual("b", new RegexParser("b").parse().rootNode.patternNode.value);
  }

  @TestMethod
  @TestData("", 0)
  @TestData("u", 1)
  @TestData("v", 1)
  public stopsAnEscapeAtABoundedReaderSplittingASurrogatePair(flags: string, diagnosticCount: number): void {
    const source = new Source(`prefix\\😀${flags}`);
    const reader = new SourceReader(source, new SourceSpan(6, 2));
    const result = new RegexParser(reader, new SourceSpan(9, flags.length), new SourceSpan(6, 3 + flags.length)).parse();
    const nodes = result.rootNode.patternNode.disjunctionNode.children[0].children;
    const node = nodes[0];

    Assert.areEqual(1, nodes.length);
    Assert.isDefined(node);
    Assert.areEqual(6, node.span.startOffset);
    Assert.areEqual(2, node.span.length);
    Assert.areEqual(8, reader.currentOffset);
    Assert.areEqual("\uDE00", source.content.charAt(reader.currentOffset));
    Assert.areEqual(diagnosticCount, result.diagnostics.length);

    if (diagnosticCount === 0) {
      Assert.isInstanceOf(node, RegexIdentityEscapeNode);
      Assert.areEqual(0xD83D, node.codePoint);
      Assert.areEqual("\\\uD83D", node.value);
    }
    else {
      Assert.isInstanceOf(node, RegexUnknownNode);
      Assert.areEqual("\\\uD83D", node.value);
      Assert.areEqual("CTX1014", result.diagnostics[0]?.code.displayText);
      Assert.areEqual(6, result.diagnostics[0]?.location?.start);
      Assert.areEqual(2, result.diagnostics[0]?.location?.length);
    }
  }

  @TestMethod
  public comparesAsciiClassStringsWithThePinnedBootstrapHost(): void {
    Assert.areEqual("24.21.0", process.versions.node);
    Assert.areEqual("17.0", process.versions["unicode"]);

    for (let codePoint = 0x20; codePoint <= 0x7e; codePoint++) {
      const character = String.fromCodePoint(codePoint);
      this.compareWithHost(`[\\q{${character}}]`, "v");
      this.compareWithHost(`[\\q{${character}${character}}]`, "v");
      this.compareWithHost(`[\\q{\\${character}}]`, "v");
    }
  }

  @TestMethod
  @TestData("&&")
  @TestData("--")
  public comparesProfileStableSetOperandsWithTheBootstrapHost(operator: string): void {
    const operands = ["a", "ab", "a-z", "[a-z]", "[ab]", "[]", "[^a]", "\\d", "\\q{a}", "\\q{ab}", "\\p{ASCII}", "\\p{Basic_Emoji}"];
    for (const first of operands)
      for (const second of operands)
        this.compareWithHost(`[${first}${operator}${second}]`, "v");
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public comparesNamedReferenceContextsWithTheBootstrapHost(flags: string): void {
    for (const reference of ["\\k<n>", "[\\k<n>]", "[\\k]", "\\k<m>", "\\k<>"])
      for (const pattern of [reference, `(?<n>a)${reference}`, `${reference}(?<n>a)`])
        this.compareWithHost(pattern, flags);
  }

  @TestMethod
  @TestData("")
  @TestData("u")
  @TestData("v")
  public keepsIdentifierCharactersOnUnicode15Point1(flags: string): void {
    const kawi = String.fromCodePoint(0x11f04);
    const garay = String.fromCodePoint(0x10d50);
    for (const groupName of [kawi, "\\u{11F04}"])
      Assert.areEqual(0, new RegexParser(`(?<${groupName}>a)`, flags).parse().diagnostics.length);

    for (const groupName of [garay, "\\u{10D50}"]) {
      const result = new RegexParser(`(?<${groupName}>a)`, flags).parse();
      Assert.areEqual(1, result.diagnostics.length);
      Assert.areEqual("CTX1023", result.diagnostics[0]?.code.displayText);
    }
  }

  @TestMethod
  @TestData("u")
  @TestData("v")
  public keepsUnicodePropertyNamesOnUnicode15Point1(flags: string): void {
    Assert.areEqual(0, new RegexParser("\\p{Script=Kawi}", flags).parse().diagnostics.length);
    const result = new RegexParser("\\p{Script=Garay}", flags).parse();
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1020", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  @TestData("[a--]")
  @TestData("[a&&]")
  public preservesTheFirstOperandWhenRecoveringAnIncompleteSetOperator(pattern: string): void {
    const result = new RegexParser(pattern, "v").parse();
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1028", result.diagnostics[0]?.code.displayText);
    const characterClass = result.rootNode.patternNode.disjunctionNode.children[0].children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.isInstanceOf(characterClass.expressionNode, CompositeNode);
    Assert.areEqual(1, characterClass.expressionNode.children.length);
  }

  @TestMethod
  public keepsAnEmptyPatternAlternativeValid(): void {
    const result = new RegexParser("").parse();
    const disjunctionNode = result.rootNode.patternNode.disjunctionNode;
    Assert.areEqual(1, disjunctionNode.children.length);
    Assert.areEqual(0, disjunctionNode.children[0].children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public parsesTextWithoutRequiringContexts(): void {
    const parser = new RegexParser("a+");
    const result = parser.parse();
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];

    Assert.areEqual("a+", result.rootNode.patternNode.value);
    Assert.areEqual("", result.rootNode.flagsNode.value);
    Assert.areEqual("a+", result.rootNode.rawValue);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    Assert.isInstanceOf(alternative.children[1], RegexQuantifierNode);
    Assert.areEqual(1n, alternative.children[1].minimum);
    Assert.isUndefined(alternative.children[1].maximum);
    Assert.isFalse("context" in parser);
    Assert.isFalse("advance" in parser);
    Assert.isFalse("lookAhead" in parser);
  }

  @TestMethod
  public acceptsExplicitlyUndefinedFlags(): void {
    const result = new RegexParser("a", undefined).parse();
    Assert.areEqual("", result.rootNode.flagsNode.value);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  @TestData("", "")
  @TestData("abc", "gi")
  @TestData("[a&&b]", "v")
  public preservesPatternFlagsAndTheirContiguousSourceSpans(pattern: string, flags: string): void {
    const result = new RegexParser(pattern, flags).parse();
    Assert.areEqual(pattern + flags, result.rootNode.rawValue);
    Assert.areEqual(pattern, result.rootNode.patternNode.value);
    Assert.areEqual(flags, result.rootNode.flagsNode.value);
    Assert.areEqual(0, result.rootNode.patternNode.span.startOffset);
    Assert.areEqual(pattern.length, result.rootNode.flagsNode.span.startOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public returnsDiagnosticsForMalformedSyntax(): void {
    const result = new RegexParser("[a", "u").parse();
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1004", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(2, result.diagnostics[0]?.location?.start);
  }

  @TestMethod
  @TestData("*\\q", "u", "CTX1014@1+2,CTX1013@0+1")
  @TestData("(?\\", "", "CTX1014@2+1,CTX1005@2+1,CTX1010@2+1,CTX1003@3+0")
  @TestData("[\\q{\\k}]", "v", "CTX1014@4+2,CTX1036@4+2")
  @TestData("[\\", "v", "CTX1014@1+1,CTX1034@1+1,CTX1004@2+0")
  @TestData("\\uZZZZ", "u", "CTX1014@0+2")
  @TestData("\\uffZf", "u", "CTX1014@0+4")
  @TestData("\\uff_ff", "u", "CTX1014@0+4")
  @TestData("\\u{ZZ}", "u", "CTX1014@0+3,CTX1033@5+1")
  @TestData("\\u{10_ffff}", "u", "CTX1014@0+5,CTX1033@10+1")
  @TestData("\\u{}", "u", "CTX1014@0+3,CTX1033@3+1")
  @TestData("\\u{110000}", "u", "CTX1014@0+9,CTX1033@9+1")
  @TestData("\\xZZ", "u", "CTX1014@0+2")
  @TestData("\\xf_f", "u", "CTX1014@0+3")
  @TestData("\\uZZZZ", "", "")
  @TestData("\\u{ZZ}", "", "")
  public publishesLexicalDiagnosticsAsTheirNodesAreLexed(pattern: string, flags: string, expectedDiagnostics: string): void {
    const result = new RegexParser(pattern, flags).parse();

    Assert.areEqual(expectedDiagnostics, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}+${t.location?.length}`).join(","));
  }

  @TestMethod
  public validatesFlagsAsPartOfParsing(): void {
    const result = new RegexParser("a", "gg").parse();
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("gg", result.rootNode.flagsNode.value);
  }

  @TestMethod
  public preservesEmbeddedInputAndAbsoluteSpans(): void {
    const source = new Source("before/abc/gi after", "source.ts");
    const result = new RegexParser(source, new SourceSpan(7, 3), new SourceSpan(11, 2), new SourceSpan(6, 7)).parse();

    Assert.areEqual("/abc/gi", result.rootNode.rawValue);
    Assert.areEqual("abc", result.rootNode.patternNode.value);
    Assert.areEqual("gi", result.rootNode.flagsNode.value);
    Assert.areEqual(7, result.rootNode.patternNode.span.startOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public consumesOnlyTheSharedReaderRegion(): void {
    const source = new Source("before[ab]v after", "source.ts");
    const reader = new SourceReader(source, new SourceSpan(6, 4));
    const result = new RegexParser(reader, new SourceSpan(10, 1), new SourceSpan(6, 5)).parse();

    Assert.areEqual("[ab]", result.rootNode.patternNode.value);
    Assert.areEqual(6, result.rootNode.patternNode.span.startOffset);
    Assert.areEqual(10, reader.currentOffset);
    Assert.isTrue(reader.isAtEnd);
    Assert.areEqual("v", result.rootNode.flagsNode.value);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public respectsThePatternBoundaryWhenFlagsFollowAGap(): void {
    const source = new Source("[!!v");
    const reader = new SourceReader(source, new SourceSpan(0, 2));
    const result = new RegexParser(reader, new SourceSpan(3, 1), new SourceSpan(0, 4)).parse();

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1004", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(2, reader.currentOffset);
  }

  @TestMethod
  public rejectsInconsistentInputBoundaries(): void {
    const source = new Source("ab");
    Assert.throws(() => new RegexParser(source, new SourceSpan(0, 2), new SourceSpan(1, 1), new SourceSpan(0, 2)), ArgumentException);
  }

  @TestMethod
  public requiresTheSharedReaderToStartAtItsRegionBeginning(): void {
    const source = new Source("ab");
    const reader = new SourceReader(source);
    reader.advance();

    Assert.throws(() => new RegexParser(reader, new SourceSpan(2, 0), new SourceSpan(0, 2)), ArgumentException);
  }

  private compareWithHost(pattern: string, flags: string): void {
    let hostAccepts = true;
    try {
      new RegExp(pattern, flags);
    }
    catch (error) {
      Assert.isInstanceOf(error, SyntaxError);
      hostAccepts = false;
    }

    const result = new RegexParser(pattern, flags).parse();
    Assert.areEqual(hostAccepts, result.diagnostics.length === 0, `${JSON.stringify(pattern)} / ${flags}`);
  }
}
