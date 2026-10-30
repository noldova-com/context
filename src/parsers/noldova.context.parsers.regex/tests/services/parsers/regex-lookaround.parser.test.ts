/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexLookaheadAssertionNode, RegexLookbehindAssertionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexLookaroundParserTests {
  @TestMethod
  public parsesLookaheadAndLookbehindAssertions(): void {
    Assert.isInstanceOf(RegexParserFixture.parseFirstAlternative("(?=a)").children[0], RegexLookaheadAssertionNode);
    Assert.isInstanceOf(RegexParserFixture.parseFirstAlternative("(?<=a)").children[0], RegexLookbehindAssertionNode);
  }
}
