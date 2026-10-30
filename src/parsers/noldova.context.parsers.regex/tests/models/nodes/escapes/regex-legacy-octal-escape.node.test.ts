/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexLegacyOctalEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexLegacyOctalEscapeNodeTests {
  @TestMethod
  public constructorPreservesValueCodePointAndSpan(): void {
    const value = "\\123";
    const span = new SourceSpan(4, value.length);
    const node = new RegexLegacyOctalEscapeNode(value, 0x53, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(0x53, node.codePoint);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
