/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexOpenBracketNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexOpenBracketNodeTests {
  @TestMethod
  public constructorPreservesValueAndSpan(): void {
    const span = new SourceSpan(3, "[".length);
    const node = new RegexOpenBracketNode(span);

    Assert.areEqual("[", node.value);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
