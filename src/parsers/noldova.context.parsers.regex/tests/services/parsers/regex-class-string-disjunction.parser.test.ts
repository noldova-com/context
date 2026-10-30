/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterClassNode, RegexCharacterNode, RegexClassStringDisjunctionNode, RegexClassStringNode, RegexClassUnionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexClassStringDisjunctionParserTests {
  @TestMethod
  @TestData("(")
  @TestData(")")
  @TestData("{")
  @TestData("/")
  @TestData("-")
  public rejectsUnescapedClassSetSyntax(character: string): void {
    const result = RegexParserFixture.parse(`[\\q{${character}}]`, "v");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1034", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(4, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  @TestData("&", "CTX1036")
  @TestData("!", "CTX1029")
  @TestData("#", "CTX1029")
  @TestData("$", "CTX1029")
  @TestData("%", "CTX1029")
  @TestData("*", "CTX1029")
  @TestData("+", "CTX1029")
  @TestData(",", "CTX1029")
  @TestData(".", "CTX1029")
  @TestData(":", "CTX1029")
  @TestData(";", "CTX1029")
  @TestData("<", "CTX1029")
  @TestData("=", "CTX1029")
  @TestData(">", "CTX1029")
  @TestData("?", "CTX1029")
  @TestData("@", "CTX1029")
  @TestData("^", "CTX1029")
  @TestData("`", "CTX1029")
  @TestData("~", "CTX1029")
  public rejectsReservedDoublePunctuators(character: string, code: string): void {
    const result = RegexParserFixture.parse(`[\\q{${character}${character}}]`, "v");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(4, result.diagnostics[0]?.location?.start);
    Assert.areEqual(2, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  @TestData("[\\q{\\(\\)\\[\\]\\{\\}\\/\\-\\|\\\\}]")
  @TestData("[\\q{!#$%*+,.:;<=>?@^`~&}]")
  @TestData("[\\q{!\\!}]")
  @TestData("[\\q{\\!!}]")
  @TestData("[\\q{\\&\\&}]")
  @TestData("[\\q{!|!}]")
  @TestData("[\\q{}]")
  public acceptsEscapedSyntaxSinglePunctuatorsAndSeparators(pattern: string): void {
    Assert.areEqual(0, RegexParserFixture.parse(pattern, "v").diagnostics.length);
  }

  @TestMethod
  public parsesStringAlternativesIncludingEmptyStrings(): void {
    const result = RegexParserFixture.parse("[\\q{ab||c}]", "v");
    Assert.areEqual(0, result.diagnostics.length);
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.areEqual(1, alternative.children.length);
    const characterClass = alternative.children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.areEqual(0, characterClass.span.startOffset);
    Assert.areEqual(11, characterClass.span.length);
    const expression = characterClass.expressionNode;
    Assert.isInstanceOf(expression, RegexClassUnionNode);
    Assert.areEqual(1, expression.children.length);
    const disjunction = expression.children[0];
    Assert.isInstanceOf(disjunction, RegexClassStringDisjunctionNode);

    Assert.areEqual(1, disjunction.span.startOffset);
    Assert.areEqual(9, disjunction.span.length);
    Assert.areEqual(3, disjunction.children.length);
    const firstString = disjunction.children[0];
    Assert.isInstanceOf(firstString, RegexClassStringNode);
    Assert.areEqual(4, firstString.span.startOffset);
    Assert.areEqual(2, firstString.span.length);
    Assert.areEqual(2, firstString.children.length);
    const firstCharacter = firstString.children[0];
    const secondCharacter = firstString.children[1];
    Assert.isInstanceOf(firstCharacter, RegexCharacterNode);
    Assert.isInstanceOf(secondCharacter, RegexCharacterNode);
    Assert.areEqual("a", firstCharacter.value);
    Assert.areEqual("b", secondCharacter.value);
    const emptyString = disjunction.children[1];
    const finalString = disjunction.children[2];
    Assert.isInstanceOf(emptyString, RegexClassStringNode);
    Assert.isInstanceOf(finalString, RegexClassStringNode);
    Assert.areEqual(0, emptyString.children.length);
    Assert.areEqual(7, emptyString.span.startOffset);
    Assert.areEqual(0, emptyString.span.length);
    Assert.areEqual(1, finalString.children.length);
    Assert.areEqual(8, finalString.span.startOffset);
    Assert.areEqual(1, finalString.span.length);
    const finalCharacter = finalString.children[0];
    Assert.isInstanceOf(finalCharacter, RegexCharacterNode);
    Assert.areEqual("c", finalCharacter.value);
    Assert.isTrue(disjunction.mayContainStrings);
  }

  @TestMethod
  public continuesParsingAfterTheClassStringAndCharacterClassClose(): void {
    const result = RegexParserFixture.parse("[\\q{a}]b", "v");
    Assert.areEqual(0, result.diagnostics.length);
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.areEqual(2, alternative.children.length);
    const characterClass = alternative.children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.areEqual(0, characterClass.span.startOffset);
    Assert.areEqual(7, characterClass.span.length);
    const expression = characterClass.expressionNode;
    Assert.isInstanceOf(expression, RegexClassUnionNode);
    Assert.areEqual(1, expression.children.length);
    const disjunction = expression.children[0];
    Assert.isInstanceOf(disjunction, RegexClassStringDisjunctionNode);
    Assert.areEqual(1, disjunction.children.length);
    Assert.areEqual(1, disjunction.span.startOffset);
    Assert.areEqual(5, disjunction.span.length);
    const character = disjunction.children[0].children[0];
    Assert.isInstanceOf(character, RegexCharacterNode);
    Assert.areEqual("a", character.value);
    const followingCharacter = alternative.children[1];
    Assert.isInstanceOf(followingCharacter, RegexCharacterNode);
    Assert.areEqual("b", followingCharacter.value);
    Assert.areEqual(7, followingCharacter.span.startOffset);
    Assert.areEqual(1, followingCharacter.span.length);
  }

  @TestMethod
  public validatesNegatedUnclosedAndNonCharacterStrings(): void {
    const negated = RegexParserFixture.parse("[^\\q{ab}]", "v");
    const unclosed = RegexParserFixture.parse("[\\q{ab]", "v");
    const nonCharacter = RegexParserFixture.parse("[\\q{\\d}]", "v");

    Assert.areEqual(1, negated.diagnostics.length);
    Assert.areEqual("CTX1030", negated.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, negated.diagnostics[0]?.location?.start);
    Assert.areEqual(9, negated.diagnostics[0]?.location?.length);
    Assert.areEqual("CTX1036,CTX1031,CTX1004", unclosed.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual(6, unclosed.diagnostics[0]?.location?.start);
    Assert.areEqual(1, unclosed.diagnostics[0]?.location?.length);
    Assert.areEqual(7, unclosed.diagnostics[1]?.location?.start);
    Assert.areEqual(0, unclosed.diagnostics[1]?.location?.length);
    Assert.areEqual(7, unclosed.diagnostics[2]?.location?.start);
    Assert.areEqual(0, unclosed.diagnostics[2]?.location?.length);
    Assert.areEqual(1, nonCharacter.diagnostics.length);
    Assert.areEqual("CTX1036", nonCharacter.diagnostics[0]?.code.displayText);
    Assert.areEqual(4, nonCharacter.diagnostics[0]?.location?.start);
    Assert.areEqual(2, nonCharacter.diagnostics[0]?.location?.length);
  }
}
