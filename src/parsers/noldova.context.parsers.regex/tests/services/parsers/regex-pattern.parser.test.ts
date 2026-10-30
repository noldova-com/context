/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexPatternParserTests {
  @TestMethod
  public preservesEmptyAndNonEmptyPatternText(): void {
    const empty = RegexParserFixture.parse(String.empty).rootNode.patternNode;
    const pattern = RegexParserFixture.parse("a|bc").rootNode.patternNode;

    Assert.areEqual(String.empty, empty.value);
    Assert.areEqual(0, empty.span.length);
    Assert.areEqual("a|bc", pattern.value);
    Assert.areEqual(4, pattern.span.length);
  }
}
