/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  RegexAlternativeNode,
  RegexCharacterClassNode,
  RegexCharacterNode,
  RegexCharacterRangeNode,
  RegexClassUnionNode,
  RegexHyphenNode,
  RegexIdentityEscapeNode,
  RegexUnicodeEscapeNode
} from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCharacterClassParserTests {
  @TestMethod
  @TestData("\uD800\uDC00", 0xD800, 0xDC00)
  @TestData("😀", 0xD83D, 0xDE00)
  @TestData("\uDBFF\uDFFF", 0xDBFF, 0xDFFF)
  public preservesLegacyEscapedSurrogatesAtRangeBoundaries(value: string, leadingCodeUnit: number, trailingCodeUnit: number): void {
    const result = RegexParserFixture.parse(`[\\${value}-\\uDFFF]`);
    const characterClass = result.rootNode.patternNode.disjunctionNode.children[0].children[0];

    Assert.areEqual(0, result.diagnostics.length);
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.isInstanceOf(characterClass.expressionNode, RegexClassUnionNode);
    Assert.areEqual(2, characterClass.expressionNode.children.length);

    const identity = characterClass.expressionNode.children[0];
    const range = characterClass.expressionNode.children[1];
    Assert.isInstanceOf(identity, RegexIdentityEscapeNode);
    Assert.areEqual(leadingCodeUnit, identity.codePoint);
    Assert.areEqual(`\\${String.fromCharCode(leadingCodeUnit)}`, identity.value);
    Assert.areEqual(1, identity.span.startOffset);
    Assert.areEqual(2, identity.span.length);
    Assert.isInstanceOf(range, RegexCharacterRangeNode);
    Assert.areEqual(3, range.span.startOffset);
    Assert.areEqual(8, range.span.length);
    Assert.isInstanceOf(range.startNode, RegexCharacterNode);
    Assert.areEqual(String.fromCharCode(trailingCodeUnit), range.startNode.value);
    Assert.areEqual(3, range.startNode.span.startOffset);
    Assert.areEqual(1, range.startNode.span.length);
    Assert.isInstanceOf(range.endNode, RegexUnicodeEscapeNode);
    Assert.areEqual(0xDFFF, range.endNode.codePoint);
    Assert.areEqual(5, range.endNode.span.startOffset);
    Assert.areEqual(6, range.endNode.span.length);
  }

  @TestMethod
  public diagnosesOnlyTheDescendingLegacySurrogateRange(): void {
    const result = RegexParserFixture.parse("[\\😀-\\uDDFF]");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1026", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(3, result.diagnostics[0]?.location?.start);
    Assert.areEqual(8, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  @TestData("u")
  @TestData("v")
  public combinesFixedSurrogateEscapesInUnicodeRanges(flags: string): void {
    const result = RegexParserFixture.parse("[\\uD83D\\uDE00-\\uD83D\\uDE01]", flags);
    const characterClass = result.rootNode.patternNode.disjunctionNode.children[0].children[0];

    Assert.areEqual(0, result.diagnostics.length);
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.isInstanceOf(characterClass.expressionNode, RegexClassUnionNode);
    Assert.areEqual(1, characterClass.expressionNode.children.length);

    const range = characterClass.expressionNode.children[0];
    Assert.isInstanceOf(range, RegexCharacterRangeNode);
    Assert.isInstanceOf(range.startNode, RegexUnicodeEscapeNode);
    Assert.isInstanceOf(range.endNode, RegexUnicodeEscapeNode);
    Assert.areEqual(0x1F600, range.startNode.codePoint);
    Assert.areEqual(0x1F601, range.endNode.codePoint);
    Assert.areEqual(1, range.startNode.span.startOffset);
    Assert.areEqual(12, range.startNode.span.length);
    Assert.areEqual(14, range.endNode.span.startOffset);
    Assert.areEqual(12, range.endNode.span.length);
  }

  @TestMethod
  public doesNotApplyUnicodeSetStringRulesToClassicClasses(): void {
    const result = RegexParserFixture.parse("[^\\p{Basic_Emoji}]", "u");
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1021", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  @TestData(512)
  @TestData(4096)
  public handlesNestedUnicodeSetsAtAndBeyondTheSupportedDepth(depth: number): void {
    const pattern = "[".repeat(depth) + "a" + "]".repeat(depth) + "z";
    const parser = RegexParserFixture.createSyntaxParser(pattern, "v");
    const result = parser.parse();

    Assert.areEqual(depth > 512 ? 1 : 0, result.diagnostics.length);
    if (depth > 512)
      Assert.areEqual("CTX1037", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(pattern.length, parser.regexLexer.reader.currentOffset);
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    Assert.areEqual(2, alternative.children.length);
    Assert.areEqual(pattern.length - 1, alternative.children[1]?.span.startOffset);
  }

  @TestMethod
  public sharesTheNestingLimitWithEnclosingGroups(): void {
    const pattern = "(".repeat(300) + "[".repeat(300) + "a" + "]".repeat(300) + ")".repeat(300);
    const parser = RegexParserFixture.createSyntaxParser(pattern, "v");
    const result = parser.parse();

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1037", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public recoversFromUnterminatedExcessivelyNestedSets(): void {
    const parser = RegexParserFixture.createSyntaxParser("[".repeat(600) + "a", "v");
    const result = parser.parse();

    Assert.isTrue(result.diagnostics.some(t => t.code.displayText === "CTX1037"));
    Assert.isTrue(result.diagnostics.some(t => t.code.displayText === "CTX1004"));
    Assert.areEqual(601, parser.regexLexer.reader.currentOffset);
  }

  @TestMethod
  public parsesEmptyNegatedAndRangedClassicClasses(): void {
    const empty = this.getClass("[]");
    const negated = this.getClass("[^a]");
    const ranged = this.getClass("[a-z]");

    Assert.isInstanceOf(empty.expressionNode, RegexClassUnionNode);
    Assert.areEqual(0, empty.expressionNode.children.length);
    Assert.isTrue(negated.negated);
    Assert.isInstanceOf(ranged.expressionNode, RegexClassUnionNode);
    Assert.isInstanceOf(ranged.expressionNode.children[0], RegexCharacterRangeNode);
  }

  @TestMethod
  public preservesATrailingHyphenAsAClassMember(): void {
    const characterClass = this.getClass("[a-]");
    Assert.isInstanceOf(characterClass.expressionNode, RegexClassUnionNode);

    Assert.areEqual(2, characterClass.expressionNode.children.length);
    Assert.isInstanceOf(characterClass.expressionNode.children[1], RegexHyphenNode);
  }

  @TestMethod
  public recoversAtTheEndOfAnUnclosedClass(): void {
    const result = RegexParserFixture.parse("[a");
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);
    const characterClass = alternative.children[0];

    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.areEqual(2, characterClass.span.length);
    Assert.isInstanceOf(characterClass.expressionNode, RegexClassUnionNode);
    Assert.areEqual("CTX1004", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public validatesClassicCharacterRanges(): void {
    const reversed = RegexParserFixture.parse("[z-a]");
    const classBound = RegexParserFixture.parse("[a-\\d]", "u");

    Assert.isTrue(reversed.diagnostics.some(t => t.code.displayText === "CTX1026"));
    Assert.isTrue(classBound.diagnostics.some(t => t.code.displayText === "CTX1025"));
  }

  private getClass(pattern: string): RegexCharacterClassNode {
    const alternative = RegexParserFixture.parseFirstAlternative(pattern);
    const characterClass = alternative.children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    return characterClass;
  }
}
