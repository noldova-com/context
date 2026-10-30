/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentException } from "@noldova/context.exceptions";
import { CompositeNode, SourceSpan } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexDisjunctionNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexDisjunctionNodeTests {
  @TestMethod
  public rejectsAnEmptyCollection(): void {
    const exception = Assert.throws(() => new RegexDisjunctionNode([], new SourceSpan(0, 0)), ArgumentException);
    Assert.areEqual("alternatives", exception.parameterName);
  }

  @TestMethod
  public ownsANonEmptySnapshot(): void {
    const span = new SourceSpan(0, 1);
    const firstNode = new RegexAlternativeNode([], span);
    const alternatives: RegexAlternativeNode[] = [firstNode];
    const node = new RegexDisjunctionNode(alternatives, span);
    alternatives.length = 0;

    const retainedNode: RegexAlternativeNode = node.children[0];
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(firstNode, retainedNode);
    Assert.areEqual(span, node.span);
  }

  @TestMethod
  public constructorPreservesSpanAndAlternatives(): void {
    const alternative = new RegexAlternativeNode([], new SourceSpan(0, 0));
    const sourceAlternatives: RegexAlternativeNode[] = [alternative];
    const span = new SourceSpan(0, 0);
    const node = new RegexDisjunctionNode(sourceAlternatives, span);

    Assert.areEqual(span, node.span);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(alternative, node.children[0]);
    Assert.isInstanceOf(node, CompositeNode);
  }
}
