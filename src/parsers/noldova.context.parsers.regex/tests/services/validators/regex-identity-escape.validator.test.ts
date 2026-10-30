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
export class RegexIdentityEscapeValidatorTests {
  @TestMethod
  public permitsLegacyIdentityEscapesButRejectsThemInUnicodeMode(): void {
    Assert.areEqual(0, RegexParserFixture.parse("\\a").diagnostics.length);
    Assert.areEqual("CTX1014", RegexParserFixture.parse("\\a", "u").diagnostics[0]?.code.displayText);
  }
}
