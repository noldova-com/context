/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexDecimalEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexDecimalEscapeNodeTests {
  @TestMethod
  public constructorPreservesValueDecimalValueAndSpan(): void {
    const value = "\\12";
    const span = new SourceSpan(2, value.length);
    const node = new RegexDecimalEscapeNode(value, 12n, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(12n, node.decimalValue);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
