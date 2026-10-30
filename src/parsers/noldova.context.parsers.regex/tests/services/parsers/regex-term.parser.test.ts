/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterNode, RegexLookaheadAssertionNode, RegexQuantifierNode, RegexStartAssertionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexTermParserTests {
  @TestMethod
  public separatesAssertionsAtomsAndUnrecognizedTerms(): void {
    const assertionTerms = RegexParserFixture.parseFirstAlternative("^a");
    const unrecognizedTerms = RegexParserFixture.parseFirstAlternative("*a");

    Assert.isInstanceOf(assertionTerms.children[0], RegexStartAssertionNode);
    Assert.isInstanceOf(assertionTerms.children[1], RegexCharacterNode);
    Assert.isInstanceOf(unrecognizedTerms.children[0], RegexQuantifierNode);
    Assert.isInstanceOf(unrecognizedTerms.children[1], RegexCharacterNode);
  }

  @TestMethod
  public permitsAnnexBQuantifiedLookaheadsOutsideUnicodeMode(): void {
    const alternative = RegexParserFixture.parseFirstAlternative("(?=a)*");

    Assert.isInstanceOf(alternative.children[0], RegexLookaheadAssertionNode);
    Assert.isInstanceOf(alternative.children[1], RegexQuantifierNode);
  }
}
