/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexUnicodePropertyEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class UnicodePropertyEscapeLexerTests {
  @TestMethod
  public lexesNamedUnicodeProperties(): void {
    const node = RegexParserFixture.parseFirstAlternative("\\p{Script=Greek}", "u").children[0];

    Assert.isInstanceOf(node, RegexUnicodePropertyEscapeNode);
    Assert.areEqual("Script", node.propertyName);
    Assert.areEqual("Greek", node.propertyValue);
  }
}
