/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCharacterRangeValidatorTests {
  @TestMethod
  public acceptsEverySingleCharacterEndpointFamily(): void {
    for (const pattern of [
      "[a-b]",
      "[\\b-\\t]",
      "[\\n-\\v]",
      "[\\f-\\r]",
      "[\\0-\\cA]",
      "[\\c0-\\x41]",
      "[\\.-\\u0041]"])
      Assert.areEqual(0, RegexParserFixture.parse(pattern).diagnostics.length);

    Assert.areEqual(0, RegexParserFixture.parse("[\\1-\\2]").diagnostics.length);
    Assert.areEqual(0, RegexParserFixture.parse("[\\u0041-\\u0042]", "u").diagnostics.length);
  }

  @TestMethod
  public reportsReversedRanges(): void {
    const ordinary = RegexParserFixture.parse("[z-a]", "u");
    const hyphen = RegexParserFixture.parse("[a--b]");

    Assert.areEqual("CTX1026", ordinary.diagnostics[0]?.code.displayText);
    Assert.areEqual("CTX1026", hyphen.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public reportsCharacterClassEndpointsOnlyInUnicodeMode(): void {
    const unicode = RegexParserFixture.parse("[\\d-a]", "u");
    const annexB = RegexParserFixture.parse("[\\d-a]");

    Assert.areEqual("CTX1025", unicode.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, annexB.diagnostics.length);
  }
}
