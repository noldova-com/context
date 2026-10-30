/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexBackspaceEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexBackspaceEscapeNodeExtensionsTests {
  @TestMethod
  public returnsTheBackspaceCodePoint(): void {
    Assert.areEqual(0x08, new RegexBackspaceEscapeNode(new SourceSpan(0, 2)).getRegexCharacterValue());
  }
}
