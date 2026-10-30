/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAccessorKindKeywordNode,
  TypeScriptContextualKeywordNode,
  TypeScriptGetKeywordNode,
  TypeScriptSetKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptAccessorKindKeywordNodeTests {
  @TestMethod
  public namesTheGetAndSetKeywordsAsContextualKeywords(): void {
    const getNode = new TypeScriptGetKeywordNode(new SourceSpan(0, 3));
    const setNode = new TypeScriptSetKeywordNode(new SourceSpan(4, 3));

    for (const node of [getNode, setNode]) {
      Assert.isInstanceOf(node, TypeScriptAccessorKindKeywordNode);
      Assert.isInstanceOf(node, TypeScriptContextualKeywordNode);
    }
    Assert.areEqual("get", getNode.value);
    Assert.areEqual("set", setNode.value);
  }
}
