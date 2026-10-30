/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class WhitespaceNodeTests {
  @TestMethod
  public constructorPreservesWhitespaceText(): void {
    const node = new WhitespaceNode(" \t\n", new SourceSpan(0, 3));

    Assert.areEqual(" \t\n", node.value);
  }
}
