/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { RegexEndAssertionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexEndAssertionNodeExtensionsTests {
  @TestMethod
  public identifiesASimpleAssertion(): void {
    Assert.isTrue(new RegexEndAssertionNode(new SourceSpan(0, 1)).isSimpleRegexAssertion());
  }
}
