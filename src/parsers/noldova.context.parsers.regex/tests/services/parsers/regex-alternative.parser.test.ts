/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexCharacterNode, RegexQuantifierNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexAlternativeParserTests {
  @TestMethod
  public preservesOrderedAtomsAndTheirSeparateQuantifiers(): void {
    const alternative = RegexParserFixture.parseFirstAlternative("ab+");

    Assert.areEqual(3, alternative.children.length);
    Assert.isInstanceOf(alternative.children[0], RegexCharacterNode);
    Assert.isInstanceOf(alternative.children[1], RegexCharacterNode);
    Assert.isInstanceOf(alternative.children[2], RegexQuantifierNode);
    Assert.areEqual(3, alternative.span.length);
  }
}
