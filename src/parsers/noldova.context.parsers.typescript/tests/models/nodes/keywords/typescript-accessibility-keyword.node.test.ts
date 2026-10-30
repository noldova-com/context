/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAccessibilityKeywordNode,
  TypeScriptKeywordNode,
  TypeScriptPrivateKeywordNode,
  TypeScriptProtectedKeywordNode,
  TypeScriptPublicKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptAccessibilityKeywordNodeTests {
  @TestMethod
  public groupsItsKeywordsUnderOneBase(): void {
    const publicNode = new TypeScriptPublicKeywordNode(new SourceSpan(0, 6));
    const protectedNode = new TypeScriptProtectedKeywordNode(new SourceSpan(7, 9));
    const privateNode = new TypeScriptPrivateKeywordNode(new SourceSpan(17, 7));
    const nodes = [publicNode, protectedNode, privateNode];

    for (const node of nodes) {
      Assert.isInstanceOf(node, TypeScriptAccessibilityKeywordNode);
      Assert.isInstanceOf(node, TypeScriptKeywordNode);
    }
    Assert.areEqual("public,protected,private", nodes.map(t => t.value).join(","));
  }
}
