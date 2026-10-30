/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptConflictMarkerNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptConflictMarkerNodeTests {
  @TestMethod
  public constructorPreservesValueAndSpan(): void {
    const value = "<<<<<<< HEAD";
    const span = new SourceSpan(0, value.length);
    const node = new TypeScriptConflictMarkerNode(value, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual(span, node.span);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }
}
