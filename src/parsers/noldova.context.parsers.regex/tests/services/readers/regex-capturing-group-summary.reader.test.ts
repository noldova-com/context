/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexAlternativeNode, RegexBackreferenceNode, RegexCapturingGroupNode, RegexNamedCapturingGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexCapturingGroupSummaryReaderTests {
  @TestMethod
  public suppliesCaptureFactsForForwardReferences(): void {
    const result = RegexParserFixture.parse("\\2(a)(b)", "u");
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);

    Assert.isInstanceOf(alternative.children[0], RegexBackreferenceNode);
    Assert.areEqual(2, alternative.children[0].groupIndex);
    Assert.isInstanceOf(alternative.children[1], RegexCapturingGroupNode);
    Assert.areEqual(1, alternative.children[1].groupIndex);
    Assert.isInstanceOf(alternative.children[2], RegexCapturingGroupNode);
    Assert.areEqual(2, alternative.children[2].groupIndex);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public decodesNamedCapturesWithoutCountingAssertionsOrNonCapturingGroups(): void {
    const result = RegexParserFixture.parse("(?<na\\u006de>a)(?=b)(?<=c)(?:d)(e)", "u");
    const alternative = result.rootNode.patternNode.disjunctionNode.children[0];
    Assert.isInstanceOf(alternative, RegexAlternativeNode);

    Assert.isInstanceOf(alternative.children[0], RegexNamedCapturingGroupNode);
    Assert.areEqual("name", alternative.children[0].groupName);
    Assert.areEqual(1, alternative.children[0].groupIndex);
    Assert.isInstanceOf(alternative.children[4], RegexCapturingGroupNode);
    Assert.areEqual(2, alternative.children[4].groupIndex);
  }

  @TestMethod
  public ignoresParenthesesInsideClassicAndUnicodeSetClasses(): void {
    const classic = RegexParserFixture.parseFirstAlternative("[(](a)").children[1];
    const unicodeSet = RegexParserFixture.parseFirstAlternative("[[(]](a)", "v").children[1];

    Assert.isInstanceOf(classic, RegexCapturingGroupNode);
    Assert.areEqual(1, classic.groupIndex);
    Assert.isInstanceOf(unicodeSet, RegexCapturingGroupNode);
    Assert.areEqual(1, unicodeSet.groupIndex);
  }
}
