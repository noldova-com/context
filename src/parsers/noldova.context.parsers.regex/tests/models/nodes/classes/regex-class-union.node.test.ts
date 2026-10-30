/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, SourceSpan } from "@noldova/context.parsers";
import { RegexCharacterNode, RegexClassUnionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexClassUnionNodeTests {
  @TestMethod
  public constructorPreservesSpanAndOperands(): void {
    const first = new RegexCharacterNode("a", new SourceSpan(0, 1));
    const second = new RegexCharacterNode("b", new SourceSpan(1, 1));
    const sourceOperands: Node[] = [first, second];
    const span = new SourceSpan(0, 2);
    const node = new RegexClassUnionNode(sourceOperands, span);

    Assert.areEqual(span, node.span);
    Assert.areEqual(2, node.children.length);
    Assert.areEqual(first, node.children[0]);
    Assert.areEqual(second, node.children[1]);
    Assert.isInstanceOf(node, CompositeNode);
  }
}
