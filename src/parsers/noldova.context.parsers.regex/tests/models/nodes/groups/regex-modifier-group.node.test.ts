/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexDisjunctionNode, RegexModifierGroupNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexModifierGroupNodeTests {
  @TestMethod
  public constructorPreservesModifiersDisjunctionAndSpan(): void {
    const alternative = new RegexAlternativeNode([], new SourceSpan(7, 0));
    const disjunctionNode = new RegexDisjunctionNode([alternative], alternative.span);
    const enabledModifiers = "im";
    const disabledModifiers = "s";
    const span = new SourceSpan(0, 8);
    const node = new RegexModifierGroupNode(enabledModifiers, disabledModifiers, disjunctionNode, span);

    Assert.areEqual(enabledModifiers, node.enabledModifiers);
    Assert.areEqual(disabledModifiers, node.disabledModifiers);
    Assert.areEqual(disjunctionNode, node.disjunctionNode);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, Node);
  }
}
