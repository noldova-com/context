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
export class RegexUnicodePropertyCatalogTests {
  @TestMethod
  public acceptsExactPropertyFamiliesAndAliases(): void {
    for (const pattern of [
      "\\p{General_Category=Letter}",
      "\\p{gc=Letter}",
      "\\p{Script=Latin}",
      "\\p{sc=Latn}",
      "\\p{Script_Extensions=Latin}",
      "\\p{scx=Latn}",
      "\\p{ASCII}",
      "\\p{AHex}"])
      Assert.areEqual(0, RegexParserFixture.parse(pattern, "u").diagnostics.length);
  }

  @TestMethod
  public rejectsIncorrectCaseAndUnsupportedPropertyFamilies(): void {
    for (const pattern of [
      "\\p{script=Latin}",
      "\\p{gc=letter}",
      "\\p{Block=Basic_Latin}",
      "\\p{UnknownBinaryProperty}"])
      Assert.isTrue(RegexParserFixture.parse(pattern, "u").diagnostics.length > 0);
  }

  @TestMethod
  public acceptsTheUnicodeFifteenOneBoundary(): void {
    Assert.areEqual(0, RegexParserFixture.parse("\\p{Script=Kawi}", "u").diagnostics.length);
    Assert.areEqual(0, RegexParserFixture.parse("\\p{Script=Nag_Mundari}", "u").diagnostics.length);
    Assert.isTrue(RegexParserFixture.parse("\\p{Script=Beria_Erfe}", "u").diagnostics.length > 0);
  }

  @TestMethod
  public restrictsStringPropertiesToUnicodeSetsMode(): void {
    Assert.areEqual(0, RegexParserFixture.parse("\\p{RGI_Emoji}", "v").diagnostics.length);
    Assert.isTrue(RegexParserFixture.parse("\\p{RGI_Emoji}", "u").diagnostics.length > 0);
    Assert.isTrue(RegexParserFixture.parse("\\P{RGI_Emoji}", "v").diagnostics.length > 0);
  }
}
