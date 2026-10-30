/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexNonWordBoundaryAssertionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexNonWordBoundaryAssertionNodeExtensionsTests {
  @TestMethod
  public identifiesASimpleAssertion(): void {
    Assert.isTrue(new RegexNonWordBoundaryAssertionNode(new SourceSpan(0, 2)).isSimpleRegexAssertion());
  }
}
