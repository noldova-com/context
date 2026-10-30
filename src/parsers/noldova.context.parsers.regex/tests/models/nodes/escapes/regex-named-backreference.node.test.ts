/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexNamedBackreferenceNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexNamedBackreferenceNodeTests {
  @TestMethod
  public constructorPreservesValueGroupNameAndSpan(): void {
    const value = "\\k<chapter>";
    const span = new SourceSpan(7, value.length);
    const node = new RegexNamedBackreferenceNode(value, "chapter", span);

    Assert.areEqual(value, node.value);
    Assert.areEqual("chapter", node.groupName);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }
}
