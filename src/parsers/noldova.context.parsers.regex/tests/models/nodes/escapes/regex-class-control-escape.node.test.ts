/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexClassControlEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexClassControlEscapeNodeTests {
  @TestMethod
  public constructorPreservesValueCodePointAndSpan(): void {
    const value = "\\c0";
    const span = new SourceSpan(2, value.length);
    const node = new RegexClassControlEscapeNode(value, 16, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(16, node.codePoint);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
