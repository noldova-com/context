/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { CompositeNode, type Node, SourceSpan } from "@noldova/context.parsers";
import { RegexCharacterNode, RegexClassSubtractionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexClassSubtractionNodeTests {
  @TestMethod
  public rejectsAnEmptyCollection(): void {
    const exception = Assert.throws(() => new RegexClassSubtractionNode([], new SourceSpan(0, 0)), ArgumentException);
    Assert.areEqual("operands", exception.parameterName);
  }

  @TestMethod
  public ownsANonEmptySnapshot(): void {
    const span = new SourceSpan(0, 1);
    const firstNode = new RegexCharacterNode("a", span);
    const operands: Node[] = [firstNode];
    const node = new RegexClassSubtractionNode(operands, span);
    operands.length = 0;

    const retainedNode: Node = node.children[0];
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(firstNode, retainedNode);
    Assert.areEqual(span, node.span);
  }

  @TestMethod
  public constructorPreservesSpanAndOperands(): void {
    const left = new RegexCharacterNode("a", new SourceSpan(0, 1));
    const right = new RegexCharacterNode("b", new SourceSpan(3, 1));
    const sourceOperands: Node[] = [left, right];
    const span = new SourceSpan(0, 4);
    const node = new RegexClassSubtractionNode(sourceOperands, span);

    Assert.areEqual(span, node.span);
    Assert.areEqual(2, node.children.length);
    Assert.areEqual(left, node.children[0]);
    Assert.areEqual(right, node.children[1]);
    Assert.isInstanceOf(node, CompositeNode);
  }
}
