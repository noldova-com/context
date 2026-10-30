/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexNamedGroupBranchTests {
  @TestMethod
  public reportsNamesThatCanParticipateInTheSameMatch(): void {
    const result = RegexParserFixture.parse("(?<value>a)(?:(?<value>b)|c)", "u");

    Assert.isTrue(result.diagnostics.some(t => t.code.displayText === "CTX1024"));
  }
}
