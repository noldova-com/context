/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexDisjunctionNode, RegexPatternNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexPatternNodeTests {
  @TestMethod
  public constructorPreservesValueDisjunctionAndSpan(): void {
    const value = "a|b";
    const first = new RegexAlternativeNode([], new SourceSpan(0, 1));
    const second = new RegexAlternativeNode([], new SourceSpan(2, 1));
    const disjunctionNode = new RegexDisjunctionNode([first, second], new SourceSpan(0, value.length));
    const span = new SourceSpan(0, value.length);
    const node = new RegexPatternNode(value, disjunctionNode, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(disjunctionNode, node.disjunctionNode);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, Node);
  }
}
