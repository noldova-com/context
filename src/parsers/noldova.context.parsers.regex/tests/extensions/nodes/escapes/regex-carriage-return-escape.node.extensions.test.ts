/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexCarriageReturnEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexCarriageReturnEscapeNodeExtensionsTests {
  @TestMethod
  public returnsTheCarriageReturnCodePoint(): void {
    Assert.areEqual(0x0D, new RegexCarriageReturnEscapeNode(new SourceSpan(0, 2)).getRegexCharacterValue());
  }
}
