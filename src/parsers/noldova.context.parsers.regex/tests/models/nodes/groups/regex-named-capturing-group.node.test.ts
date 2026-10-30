/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexDisjunctionNode, RegexNamedCapturingGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexNamedCapturingGroupNodeTests {
  @TestMethod
  public constructorPreservesNameDisjunctionAndSpan(): void {
    const alternative = new RegexAlternativeNode([], new SourceSpan(8, 0));
    const disjunctionNode = new RegexDisjunctionNode([alternative], alternative.span);
    const groupName = "chapter";
    const span = new SourceSpan(0, 9);
    const node = new RegexNamedCapturingGroupNode(2, groupName, disjunctionNode, span);

    Assert.areEqual(groupName, node.groupName);
    Assert.areEqual(2, node.groupIndex);
    Assert.areEqual(disjunctionNode, node.disjunctionNode);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, Node);
  }
}
