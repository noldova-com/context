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

  @TestMethod
  public refusesAnEmptyGroupName(): void {
    const result = RegexParserFixture.parse("(?<>a)", "u");

    Assert.areEqual("CTX1023", result.diagnostics.map(t => t.code.displayText).join("|"));
  }

  @TestMethod
  public readsAnEscapedCodePointOfAGroupName(): void {
    const node = RegexParserFixture.parseFirstAlternative("(?<\u{1d4d1}ame>a)", "u").children[0];

    Assert.isInstanceOf(node, RegexNamedCapturingGroupNode);
    Assert.areEqual("𝓑ame", node.groupName);
  }
}
