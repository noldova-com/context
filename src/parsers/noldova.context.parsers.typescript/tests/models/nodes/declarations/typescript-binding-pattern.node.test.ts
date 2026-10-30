/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptArrayBindingPatternNode,
  TypeScriptBindingPatternNode,
  TypeScriptDelimitedListNode,
  TypeScriptObjectBindingPatternNode,
  TypeScriptOpenBraceNode,
  TypeScriptOpenBracketNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptBindingPatternNodeTests {
  @TestMethod
  public namesBothPatternKindsAsDelimitedLists(): void {
    const arrayNode = new TypeScriptArrayBindingPatternNode(new TypeScriptOpenBracketNode(new SourceSpan(0, 1)), [], [], new SourceSpan(0, 1));
    const objectNode = new TypeScriptObjectBindingPatternNode(new TypeScriptOpenBraceNode(new SourceSpan(0, 1)), [], [], new SourceSpan(0, 1));

    for (const node of [arrayNode, objectNode]) {
      Assert.isInstanceOf(node, TypeScriptBindingPatternNode);
      Assert.isInstanceOf(node, TypeScriptDelimitedListNode);
    }
  }
}
