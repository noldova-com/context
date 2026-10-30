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
export class RegexGroupEndParserTests {
  @TestMethod
  public reportsAnUnclosedGroup(): void {
    Assert.areEqual("CTX1003", RegexParserFixture.parse("(a").diagnostics[0]?.code.displayText);
  }
}
