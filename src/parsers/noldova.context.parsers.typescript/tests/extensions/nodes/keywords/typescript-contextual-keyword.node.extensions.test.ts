/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptOfKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptContextualKeywordNodeExtensionsTests {
  @TestMethod
  public preservesAContextualBindingName(): void {
    const node = new TypeScriptOfKeywordNode(new SourceSpan(0, 2));

    Assert.areEqual(node, node.toTypeScriptBindingName());
    const parameterNode = node.toTypeScriptParameter();
    Assert.isDefined(parameterNode);
    Assert.areEqual(node, parameterNode.nameNode);
  }

  @TestMethod
  public isABindingIdentifier(): void {
    const node = new TypeScriptOfKeywordNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptBindingIdentifier());
  }
}
