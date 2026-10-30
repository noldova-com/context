/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexCharacterNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexCharacterNodeExtensionsTests {
  @TestMethod
  public returnsItsCodePoint(): void {
    Assert.areEqual(0x1F600, new RegexCharacterNode("😀", new SourceSpan(0, 2)).getRegexCharacterValue());
  }

  @TestMethod
  public returnsUndefinedForAnEmptyValue(): void {
    Assert.isUndefined(new RegexCharacterNode(String.empty, new SourceSpan(0, 0)).getRegexCharacterValue());
  }
}
