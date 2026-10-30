/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexUnicodeEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexUnicodeEscapeNodeTests {
  @TestMethod
  public constructorPreservesValueCodePointAndSpan(): void {
    const value = "\\u{1F600}";
    const span = new SourceSpan(6, value.length);
    const node = new RegexUnicodeEscapeNode(value, 0x1F600, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(0x1F600, node.codePoint);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
