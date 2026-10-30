/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan } from "@noldova/context.parsers";
import { RegexCharacterClassNode, RegexCharacterNode, RegexClassUnionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexCharacterClassNodeTests {
  @TestMethod
  public constructorPreservesExpressionPolarityAndSpan(): void {
    const character = new RegexCharacterNode("a", new SourceSpan(2, 1));
    const expressionNode = new RegexClassUnionNode([character], character.span);
    const span = new SourceSpan(0, 4);
    const node = new RegexCharacterClassNode(expressionNode, true, false, span);

    Assert.areEqual(expressionNode, node.expressionNode);
    Assert.isTrue(node.negated);
    Assert.isFalse(node.mayContainStrings);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, Node);
  }
}
