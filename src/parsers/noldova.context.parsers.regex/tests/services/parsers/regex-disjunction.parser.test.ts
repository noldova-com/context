/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexAlternativeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexDisjunctionParserTests {
  @TestMethod
  public parsesAlternativesIncludingEmptyAlternatives(): void {
    const disjunction = RegexParserFixture.parse("|a|").rootNode.patternNode.disjunctionNode;

    Assert.areEqual(3, disjunction.children.length);
    for (const alternative of disjunction.children)
      Assert.isInstanceOf(alternative, RegexAlternativeNode);

    Assert.areEqual(0, disjunction.children[0]?.span.length);
    Assert.areEqual(1, disjunction.children[1]?.span.length);
    Assert.areEqual(0, disjunction.children[2]?.span.length);
    Assert.areEqual(3, disjunction.span.length);
  }
}
