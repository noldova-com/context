/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexUnicodeEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexUnicodeEscapeValueTests {
  @TestMethod
  public transportsTheDecodedValueIntoThePublishedNode(): void {
    const node = RegexParserFixture.parseFirstAlternative("\\u{1F600}", "u").children[0];

    Assert.isInstanceOf(node, RegexUnicodeEscapeNode);
    Assert.areEqual("\\u{1F600}", node.value);
    Assert.areEqual(0x1F600, node.codePoint);
  }
}
