/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexCapturingGroupNode, RegexDisjunctionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexCapturingGroupNodeTests {
  @TestMethod
  public constructorPreservesDisjunctionAndSpan(): void {
    const alternative = new RegexAlternativeNode([], new SourceSpan(1, 0));
    const disjunctionNode = new RegexDisjunctionNode([alternative], alternative.span);
    const span = new SourceSpan(0, 2);
    const node = new RegexCapturingGroupNode(3, disjunctionNode, span);

    Assert.areEqual(disjunctionNode, node.disjunctionNode);
    Assert.areEqual(3, node.groupIndex);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, Node);
  }
}
