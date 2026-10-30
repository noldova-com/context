/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexDisjunctionNode, RegexLookbehindAssertionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexLookbehindAssertionNodeTests {
  @TestMethod
  public constructorPreservesDisjunctionPolarityAndSpan(): void {
    const alternative = new RegexAlternativeNode([], new SourceSpan(4, 0));
    const disjunctionNode = new RegexDisjunctionNode([alternative], alternative.span);
    const span = new SourceSpan(0, 5);
    const node = new RegexLookbehindAssertionNode(disjunctionNode, false, span);

    Assert.areEqual(disjunctionNode, node.disjunctionNode);
    Assert.isFalse(node.negated);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, Node);
  }
}
