/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexModifierGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexModifierGroupParserTests {
  @TestMethod
  public parsesEnabledAndDisabledModifiers(): void {
    const node = RegexParserFixture.parseFirstAlternative("(?im-s:a)").children[0];

    Assert.isInstanceOf(node, RegexModifierGroupNode);
    Assert.areEqual("im", node.enabledModifiers);
    Assert.areEqual("s", node.disabledModifiers);
  }
}
