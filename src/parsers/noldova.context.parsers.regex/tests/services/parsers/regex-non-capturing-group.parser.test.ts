/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNonCapturingGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexNonCapturingGroupParserTests {
  @TestMethod
  public parsesNonCapturingGroups(): void {
    Assert.isInstanceOf(RegexParserFixture.parseFirstAlternative("(?:a)").children[0], RegexNonCapturingGroupNode);
  }
}
