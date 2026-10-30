/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexQuantifierNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexQuantifierNodeTests {
  @TestMethod
  public constructorPreservesBoundedGreedyQuantifier(): void {
    const value = "{2,4}";
    const span = new SourceSpan(3, value.length);
    const node = new RegexQuantifierNode(value, 2n, 4n, true, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(2n, node.minimum);
    Assert.areEqual(4n, node.maximum);
    Assert.isTrue(node.greedy);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }

  @TestMethod
  public constructorPreservesUnboundedNonGreedyQuantifier(): void {
    const node = new RegexQuantifierNode("*?", 0n, undefined, false, new SourceSpan(1, 2));

    Assert.isUndefined(node.maximum);
    Assert.isFalse(node.greedy);
  }
}
