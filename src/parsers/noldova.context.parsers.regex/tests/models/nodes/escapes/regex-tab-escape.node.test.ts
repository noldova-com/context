/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexTabEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexTabEscapeNodeTests {
  @TestMethod
  public constructorPreservesValueAndSpan(): void {
    const span = new SourceSpan(4, 2);
    const node = new RegexTabEscapeNode(span);

    Assert.areEqual("\\t", node.value);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
