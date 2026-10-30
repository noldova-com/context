/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan } from "@noldova/context.parsers";
import { RegexCharacterNode, RegexCharacterRangeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexCharacterRangeNodeTests {
  @TestMethod
  public constructorPreservesEndpointsAndSpan(): void {
    const startNode = new RegexCharacterNode("a", new SourceSpan(1, 1));
    const endNode = new RegexCharacterNode("z", new SourceSpan(3, 1));
    const span = new SourceSpan(1, 3);
    const node = new RegexCharacterRangeNode(startNode, endNode, span);

    Assert.areEqual(startNode, node.startNode);
    Assert.areEqual(endNode, node.endNode);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, Node);
  }
}
