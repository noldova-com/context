/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { LiteralNodeFixture } from "../../fixtures/literal-node.fixture.js";

@TestClass
export class ValueNodeTests {
  @TestMethod
  public constructorPreservesText(): void {
    const node = new LiteralNodeFixture("value", new SourceSpan(0, 5));

    Assert.areEqual("value", node.value);
  }
}
