/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexCharacterNode, RegexQuantifierNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexAlternativeNodeTests {
  @TestMethod
  public constructorPreservesSpanAndTerms(): void {
    const term = new RegexCharacterNode("a", new SourceSpan(0, 1));
    const quantifier = new RegexQuantifierNode("+", 1n, undefined, true, new SourceSpan(1, 1));
    const sourceTerms: Node[] = [term, quantifier];
    const span = new SourceSpan(0, 2);
    const node = new RegexAlternativeNode(sourceTerms, span);

    Assert.areEqual(span, node.span);
    Assert.areEqual(2, node.children.length);
    Assert.areEqual(term, node.children[0]);
    Assert.areEqual(quantifier, node.children[1]);
    Assert.isInstanceOf(node, CompositeNode);
  }
}
