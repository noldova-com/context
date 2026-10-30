/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexClassControlEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexClassControlEscapeNodeExtensionsTests {
  @TestMethod
  public returnsItsCodePoint(): void {
    Assert.areEqual(0x10, new RegexClassControlEscapeNode("\\c0", 0x10, new SourceSpan(0, 3)).getRegexCharacterValue());
  }
}
