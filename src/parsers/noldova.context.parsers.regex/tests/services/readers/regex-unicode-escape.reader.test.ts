/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexIdentityEscapeNode, RegexQuantifierNode, RegexUnicodeEscapeNode, RegexUnknownNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexUnicodeEscapeReaderTests {
  @TestMethod
  public readsFixedAndBracedUnicodeEscapes(): void {
    const fixed = RegexParserFixture.parseFirstAlternative("\\u0041", "u").children[0];
    const braced = RegexParserFixture.parseFirstAlternative("\\u{1F600}", "u").children[0];
    const maximum = RegexParserFixture.parseFirstAlternative("\\u{10FFFF}", "u").children[0];

    Assert.isInstanceOf(fixed, RegexUnicodeEscapeNode);
    Assert.areEqual(0x41, fixed.codePoint);
    Assert.isInstanceOf(braced, RegexUnicodeEscapeNode);
    Assert.areEqual(0x1F600, braced.codePoint);
    Assert.isInstanceOf(maximum, RegexUnicodeEscapeNode);
    Assert.areEqual(0x10FFFF, maximum.codePoint);
  }

  @TestMethod
  public combinesUnicodeSurrogatePairs(): void {
    const lowest = RegexParserFixture.parseFirstAlternative("\\uD800\\uDC00", "u").children[0];
    const ordinary = RegexParserFixture.parseFirstAlternative("\\uD83D\\uDE00", "u").children[0];
    const highest = RegexParserFixture.parseFirstAlternative("\\uDBFF\\uDFFF", "u").children[0];

    Assert.isInstanceOf(lowest, RegexUnicodeEscapeNode);
    Assert.areEqual(0x10000, lowest.codePoint);
    Assert.isInstanceOf(ordinary, RegexUnicodeEscapeNode);
    Assert.areEqual(0x1F600, ordinary.codePoint);
    Assert.isInstanceOf(highest, RegexUnicodeEscapeNode);
    Assert.areEqual(0x10FFFF, highest.codePoint);
  }

  @TestMethod
  public leavesAFollowingNonTrailingEscapeSeparate(): void {
    const children = RegexParserFixture.parseFirstAlternative("\\uD83D\\u0041", "u").children;
    const leading = children[0];
    const following = children[1];

    Assert.isInstanceOf(leading, RegexUnicodeEscapeNode);
    Assert.areEqual(0xD83D, leading.codePoint);
    Assert.isInstanceOf(following, RegexUnicodeEscapeNode);
    Assert.areEqual(0x41, following.codePoint);
  }

  @TestMethod
  public readsAnUnpairedLeadingSurrogate(): void {
    const node = RegexParserFixture.parseFirstAlternative("\\uD83D", "u").children[0];

    Assert.isInstanceOf(node, RegexUnicodeEscapeNode);
    Assert.areEqual(0xD83D, node.codePoint);
  }

  @TestMethod
  public rejectsInvalidUnicodeEscapesInUnicodeMode(): void {
    for (const pattern of ["\\u12G4", "\\u{}", "\\u{41", "\\u{110000}"])
      Assert.isInstanceOf(RegexParserFixture.parseFirstAlternative(pattern, "u").children[0], RegexUnknownNode);
  }

  @TestMethod
  public preservesBracedTextAsLegacyPatternCharactersWithoutUnicodeMode(): void {
    const children = RegexParserFixture.parseFirstAlternative("\\u{41}").children;

    Assert.isInstanceOf(children[0], RegexIdentityEscapeNode);
    Assert.isInstanceOf(children[1], RegexQuantifierNode);
    Assert.areEqual(0, RegexParserFixture.parse("\\u{41}").diagnostics.length);
  }
}
