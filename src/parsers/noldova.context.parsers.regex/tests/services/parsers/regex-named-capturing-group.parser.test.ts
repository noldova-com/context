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
export class RegexNamedCapturingGroupParserTests {
  @TestMethod
  public parsesNamedCapturingGroups(): void {
    const node = RegexParserFixture.parseFirstAlternative("(?<name>a)", "u").children[0];

    Assert.isInstanceOf(node, RegexNamedCapturingGroupNode);
    Assert.areEqual("name", node.groupName);
  }
}
