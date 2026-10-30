/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexBackreferenceNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexBackreferenceNodeTests {
  @TestMethod
  public constructorPreservesValueGroupIndexAndSpan(): void {
    const value = "\\12";
    const span = new SourceSpan(3, value.length);
    const node = new RegexBackreferenceNode(value, 12, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(12, node.groupIndex);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
