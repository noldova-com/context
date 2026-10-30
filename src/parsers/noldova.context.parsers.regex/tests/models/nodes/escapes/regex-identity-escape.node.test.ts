/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexIdentityEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexIdentityEscapeNodeTests {
  @TestMethod
  public constructorPreservesValueCodePointAndSpan(): void {
    const value = "\\$";
    const span = new SourceSpan(5, value.length);
    const node = new RegexIdentityEscapeNode(value, 0x24, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(0x24, node.codePoint);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
