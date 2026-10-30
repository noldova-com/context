/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterClassNode, RegexClassStringDisjunctionNode, RegexClassUnionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexClassStringDisjunctionNodeExtensionsTests {
  @TestMethod
  @TestData("[\\q{a|b}]", false)
  @TestData("[\\q{ab}]", true)
  @TestData("[\\q{}]", true)
  public reportsWhetherTheExpressionMayContainStrings(pattern: string, expected: boolean): void {
    const characterClass = RegexParserFixture.parseFirstAlternative(pattern, "v").children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    Assert.isInstanceOf(characterClass.expressionNode, RegexClassUnionNode);
    const node = characterClass.expressionNode.children[0];
    Assert.isInstanceOf(node, RegexClassStringDisjunctionNode);
    Assert.areEqual(expected, node.mayContainRegexStrings());
  }
}
