/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexVerticalTabEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexVerticalTabEscapeNodeExtensionsTests {
  @TestMethod
  public returnsTheVerticalTabCodePoint(): void {
    Assert.areEqual(0x0B, new RegexVerticalTabEscapeNode(new SourceSpan(0, 2)).getRegexCharacterValue());
  }
}
