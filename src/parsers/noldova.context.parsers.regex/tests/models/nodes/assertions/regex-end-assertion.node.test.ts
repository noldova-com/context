/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexEndAssertionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexEndAssertionNodeTests {
  @TestMethod
  public constructorPreservesValueAndSpan(): void {
    const span = new SourceSpan(3, 1);
    const node = new RegexEndAssertionNode(span);

    Assert.areEqual("$", node.value);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
