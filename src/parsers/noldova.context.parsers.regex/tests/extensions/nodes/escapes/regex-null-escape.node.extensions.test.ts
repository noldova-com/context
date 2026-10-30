/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexNullEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexNullEscapeNodeExtensionsTests {
  @TestMethod
  public returnsTheNullCodePoint(): void {
    Assert.areEqual(0, new RegexNullEscapeNode(new SourceSpan(0, 2)).getRegexCharacterValue());
  }
}
