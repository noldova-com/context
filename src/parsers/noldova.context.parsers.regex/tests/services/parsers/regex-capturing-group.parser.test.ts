/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCapturingGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCapturingGroupParserTests {
  @TestMethod
  public parsesCapturingGroups(): void {
    const node = RegexParserFixture.parseFirstAlternative("(a)").children[0];

    Assert.isInstanceOf(node, RegexCapturingGroupNode);
    Assert.areEqual(1, node.groupIndex);
  }
}
