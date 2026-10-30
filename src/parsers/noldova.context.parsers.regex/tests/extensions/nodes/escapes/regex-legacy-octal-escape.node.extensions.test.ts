/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexLegacyOctalEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexLegacyOctalEscapeNodeExtensionsTests {
  @TestMethod
  public returnsItsCodePoint(): void {
    Assert.areEqual(0x3F, new RegexLegacyOctalEscapeNode("\\77", 0x3F, new SourceSpan(0, 3)).getRegexCharacterValue());
  }
}
