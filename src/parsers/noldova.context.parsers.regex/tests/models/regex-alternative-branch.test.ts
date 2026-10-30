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
export class RegexAlternativeBranchTests {
  @TestMethod
  public distinguishesMutuallyExclusiveNestedAlternatives(): void {
    const result = RegexParserFixture.parse("(?:(?<value>a)|(?<value>b))", "u");

    Assert.isFalse(result.diagnostics.some(t => t.code.displayText === "CTX1024"));
  }
}
