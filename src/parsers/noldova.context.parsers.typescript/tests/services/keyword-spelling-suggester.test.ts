/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { KeywordSpellingSuggester } from "@noldova/context.parsers.typescript/services/keyword-spelling-suggester.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class KeywordSpellingSuggesterTests {
  @TestData("asynd", "async")
  @TestData("sasync", "async")
  @TestData("constd", "const")
  @TestData("Async", "async")
  @TestData("declared", "declare")
  @TestData("typed", "type")
  @TestData("functionfoo", "function")
  @TestData("constructorThing", "constructor")
  @TestData("typeo", "type")
  @TestMethod
  public suggestsTheClosestKeyword(word: string, expected: string): void {
    Assert.areEqual(expected, new KeywordSpellingSuggester().suggest(word));
  }

  @TestData("exportfunction", "export function")
  @TestData("functionfoobar", "function foobar")
  @TestMethod
  public suggestsTheSpaceAWordRanOver(word: string, expected: string): void {
    Assert.areEqual(expected, new KeywordSpellingSuggester().suggest(word));
  }

  @TestData("foo")
  @TestData("async")
  @TestData("xy")
  @TestData("somethingEntirelyDifferent")
  @TestData("zzzzz")
  @TestData("qwxjq")
  @TestMethod
  public suggestsNothingForAWordNoKeywordIsNear(word: string): void {
    Assert.isUndefined(new KeywordSpellingSuggester().suggest(word));
  }

  @TestData("dox")
  @TestData("iff")
  @TestMethod
  public suggestsNoKeywordShorterThanThreeLetters(word: string): void {
    Assert.isUndefined(new KeywordSpellingSuggester().suggest(word));
  }
}
