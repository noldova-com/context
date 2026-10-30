/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CompositeNodeFixture } from "../../fixtures/composite-node.fixture.js";
import { LiteralNodeFixture } from "../../fixtures/literal-node.fixture.js";

@TestClass
export class CompositeNodeTests {
  @TestMethod
  public constructorPreservesChildren(): void {
    const child = new LiteralNodeFixture("a", new SourceSpan(0, 1));
    const sourceChildren: Node[] = [child];
    const node = new CompositeNodeFixture(sourceChildren, new SourceSpan(0, 1));

    Assert.areEqual(1, node.children.length);
    Assert.areEqual(child, node.children[0]);
  }
}
