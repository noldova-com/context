/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexBackreferenceNode, RegexNamedBackreferenceNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCapturingGroupSummaryTests {
  @TestMethod
  public suppliesCompletePatternFactsToForwardReferences(): void {
    const alternative = RegexParserFixture.parseFirstAlternative("\\2\\k<name>(a)(?<name>b)", "u");

    Assert.isInstanceOf(alternative.children[0], RegexBackreferenceNode);
    Assert.areEqual(2, alternative.children[0].groupIndex);
    Assert.isInstanceOf(alternative.children[1], RegexNamedBackreferenceNode);
    Assert.areEqual("name", alternative.children[1].groupName);
  }
}
