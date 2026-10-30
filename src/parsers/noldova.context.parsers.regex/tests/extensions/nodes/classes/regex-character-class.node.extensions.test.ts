/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterClassNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCharacterClassNodeExtensionsTests {
  @TestMethod
  @TestData("[a]", false)
  @TestData("[\\q{ab}]", true)
  public reportsWhetherTheExpressionMayContainStrings(pattern: string, expected: boolean): void {
    const characterClass = RegexParserFixture.parseFirstAlternative(pattern, "v").children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    const node = characterClass;
    Assert.isInstanceOf(node, RegexCharacterClassNode);
    Assert.areEqual(expected, node.mayContainRegexStrings());
  }
}
