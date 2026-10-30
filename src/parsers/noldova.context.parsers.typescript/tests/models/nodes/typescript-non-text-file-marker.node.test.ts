/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptNonTextFileMarkerNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNonTextFileMarkerNodeTests {
  @TestMethod
  public constructorPreservesValueAndSpan(): void {
    const span = new SourceSpan(4, 6);
    const node = new TypeScriptNonTextFileMarkerNode("� rest", span);

    Assert.areEqual("� rest", node.value);
    Assert.areEqual(span, node.span);
  }
}
