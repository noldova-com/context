/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, ValueNode } from "@noldova/context.parsers";
import { RegexUnicodePropertyEscapeNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexUnicodePropertyEscapeNodeTests {
  @TestMethod
  public constructorPreservesNamedPropertyExpressionAndSpan(): void {
    const value = "\\p{Script=Greek}";
    const span = new SourceSpan(8, value.length);
    const node = new RegexUnicodePropertyEscapeNode(value, "Script", "Greek", false, false, span);

    Assert.areEqual(value, node.value);
    Assert.areEqual("Script", node.propertyName);
    Assert.areEqual("Greek", node.propertyValue);
    Assert.isFalse(node.negated);
    Assert.isFalse(node.mayContainStrings);
    Assert.areEqual(span, node.span);
    Assert.isInstanceOf(node, ValueNode);
  }

  @TestMethod
  public constructorPreservesNegatedLonePropertyValue(): void {
    const node = new RegexUnicodePropertyEscapeNode("\\P{Letter}", undefined, "Letter", true, false, new SourceSpan(0, 10));

    Assert.isUndefined(node.propertyName);
    Assert.areEqual("Letter", node.propertyValue);
    Assert.isTrue(node.negated);
  }
}
