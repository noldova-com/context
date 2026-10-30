/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { CompositeNode, SourceSpan } from "@noldova/context.parsers";
import { RegexCharacterNode, RegexClassStringDisjunctionNode, RegexClassStringNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexClassStringDisjunctionNodeTests {
  @TestMethod
  public rejectsAnEmptyCollection(): void {
    const exception = Assert.throws(() => new RegexClassStringDisjunctionNode([], new SourceSpan(0, 0)), ArgumentException);
    Assert.areEqual("strings", exception.parameterName);
  }

  @TestMethod
  public ownsANonEmptySnapshot(): void {
    const span = new SourceSpan(0, 1);
    const firstNode = new RegexClassStringNode([], span);
    const strings: RegexClassStringNode[] = [firstNode];
    const node = new RegexClassStringDisjunctionNode(strings, span);
    strings.length = 0;

    const retainedNode: RegexClassStringNode = node.children[0];
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(firstNode, retainedNode);
    Assert.areEqual(span, node.span);
    Assert.isTrue(node.mayContainStrings);
  }

  @TestMethod
  public constructorPreservesSpanAndStrings(): void {
    const character = new RegexCharacterNode("a", new SourceSpan(3, 1));
    const first = new RegexClassStringNode([character], character.span);
    const second = new RegexClassStringNode([], new SourceSpan(5, 0));
    const sourceStrings: RegexClassStringNode[] = [first, second];
    const span = new SourceSpan(0, 7);
    const node = new RegexClassStringDisjunctionNode(sourceStrings, span);

    Assert.areEqual(span, node.span);
    Assert.areEqual(2, node.children.length);
    Assert.isTrue(node.mayContainStrings);
    Assert.areEqual(first, node.children[0]);
    Assert.areEqual(second, node.children[1]);
    Assert.isInstanceOf(node, CompositeNode);
  }
}
