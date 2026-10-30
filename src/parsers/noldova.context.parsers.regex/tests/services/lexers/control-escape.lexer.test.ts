/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexControlLetterEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class ControlEscapeLexerTests {
  @TestMethod
  public lexesControlLetters(): void {
    const node = RegexParserFixture.parseFirstAlternative("\\cA").children[0];

    Assert.isInstanceOf(node, RegexControlLetterEscapeNode);
    Assert.areEqual(1, node.codePoint);
  }
}
