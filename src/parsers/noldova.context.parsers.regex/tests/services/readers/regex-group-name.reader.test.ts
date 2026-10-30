/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNamedCapturingGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexGroupNameReaderTests {
  @TestMethod
  public readsPlainAndEscapedNames(): void {
    const plain = RegexParserFixture.parseFirstAlternative("(?<chapter>a)", "u").children[0];
    const escaped = RegexParserFixture.parseFirstAlternative("(?<a\\u0062𐐀>a)", "u").children[0];
    const bracedWithoutUnicodeFlag = RegexParserFixture.parseFirstAlternative("(?<\\u{1d4d1}>a)").children[0];

    Assert.isInstanceOf(plain, RegexNamedCapturingGroupNode);
    Assert.areEqual("chapter", plain.groupName);
    Assert.isInstanceOf(escaped, RegexNamedCapturingGroupNode);
    Assert.areEqual("ab𐐀", escaped.groupName);
    Assert.isInstanceOf(bracedWithoutUnicodeFlag, RegexNamedCapturingGroupNode);
    Assert.areEqual("𝓑", bracedWithoutUnicodeFlag.groupName);
  }

  @TestMethod
  public reportsEmptyInvalidAndUnterminatedNames(): void {
    for (const pattern of ["(?<>a)", "(?<a\\uZZZZ>a)", "(?<name"])
      Assert.isTrue(RegexParserFixture.parse(pattern, "u").diagnostics.length > 0);
  }
}
