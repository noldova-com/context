/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  RegexEndAssertionNode,
  RegexLookaheadAssertionNode,
  RegexLookbehindAssertionNode,
  RegexNonWordBoundaryAssertionNode,
  RegexStartAssertionNode,
  RegexWordBoundaryAssertionNode
} from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexAssertionParserTests {
  @TestMethod
  public parsesSimpleAssertions(): void {
    const alternative = RegexParserFixture.parseFirstAlternative("^$\\b\\B");

    Assert.isInstanceOf(alternative.children[0], RegexStartAssertionNode);
    Assert.isInstanceOf(alternative.children[1], RegexEndAssertionNode);
    Assert.isInstanceOf(alternative.children[2], RegexWordBoundaryAssertionNode);
    Assert.isInstanceOf(alternative.children[3], RegexNonWordBoundaryAssertionNode);
  }

  @TestMethod
  public parsesPositiveAndNegativeLookarounds(): void {
    const patterns = ["(?=a)", "(?!a)", "(?<=a)", "(?<!a)"];

    for (const pattern of patterns) {
      const alternative = RegexParserFixture.parseFirstAlternative(pattern);
      const assertion = alternative.children[0];

      if (pattern.startsWith("(?<"))
        Assert.isInstanceOf(assertion, RegexLookbehindAssertionNode);
      else
        Assert.isInstanceOf(assertion, RegexLookaheadAssertionNode);

      Assert.areEqual(pattern.includes("!"), assertion.negated);
    }
  }
}
