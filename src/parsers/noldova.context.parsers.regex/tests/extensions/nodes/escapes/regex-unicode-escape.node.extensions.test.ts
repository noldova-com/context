/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexUnicodeEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexUnicodeEscapeNodeExtensionsTests {
  @TestMethod
  public returnsItsCodePoint(): void {
    Assert.areEqual(0x1F600, new RegexUnicodeEscapeNode("\\u{1F600}", 0x1F600, new SourceSpan(0, 9)).getRegexCharacterValue());
  }
}
