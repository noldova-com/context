/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexFlagsNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexFlagsNodeTests {
  @TestMethod
  public constructorIdentifiesPresentFlags(): void {
    const value = "dgimsuvy";
    const span = new SourceSpan(4, value.length);
    const node = new RegexFlagsNode(value, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(span, node.span);
    Assert.isTrue(node.hasIndices);
    Assert.isTrue(node.global);
    Assert.isTrue(node.ignoreCase);
    Assert.isTrue(node.multiline);
    Assert.isTrue(node.dotAll);
    Assert.isTrue(node.unicode);
    Assert.isTrue(node.unicodeSets);
    Assert.isTrue(node.sticky);
    Assert.isInstanceOf(node, ValueNode);
  }

  @TestMethod
  public constructorLeavesAbsentFlagsUnset(): void {
    const node = new RegexFlagsNode(String.empty, new SourceSpan(0, 0));

    Assert.isFalse(node.hasIndices);
    Assert.isFalse(node.global);
    Assert.isFalse(node.ignoreCase);
    Assert.isFalse(node.multiline);
    Assert.isFalse(node.dotAll);
    Assert.isFalse(node.unicode);
    Assert.isFalse(node.unicodeSets);
    Assert.isFalse(node.sticky);
  }
}
