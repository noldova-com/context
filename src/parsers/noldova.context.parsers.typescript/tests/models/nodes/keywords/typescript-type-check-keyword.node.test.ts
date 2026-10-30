/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAsKeywordNode,
  TypeScriptContextualKeywordNode,
  TypeScriptSatisfiesKeywordNode,
  TypeScriptTypeCheckKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeCheckKeywordNodeTests {
  @TestMethod
  public groupsItsKeywordsUnderOneBase(): void {
    const nodes = [new TypeScriptAsKeywordNode(new SourceSpan(0, 2)), new TypeScriptSatisfiesKeywordNode(new SourceSpan(0, 9))];

    for (const node of nodes) {
      Assert.isInstanceOf(node, TypeScriptTypeCheckKeywordNode);
      Assert.isInstanceOf(node, TypeScriptContextualKeywordNode);
    }
    Assert.areEqual("as,satisfies", nodes.map(t => t.value).join(","));
  }
}
