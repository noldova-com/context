/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexBackreferenceNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class NumericEscapeLexerTests {
  @TestMethod
  public lexesNumericBackreferences(): void {
    const node = RegexParserFixture.parseFirstAlternative("\\1(a)").children[0];

    Assert.isInstanceOf(node, RegexBackreferenceNode);
    Assert.areEqual(1, node.groupIndex);
  }
}
