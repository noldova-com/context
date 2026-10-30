/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptContextualKeywordNode,
  TypeScriptModuleDeclarationKeywordNode,
  TypeScriptModuleKeywordNode,
  TypeScriptNamespaceKeywordNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptModuleDeclarationKeywordNodeTests {
  @TestMethod
  public groupsItsKeywordsUnderOneBase(): void {
    const nodes = [new TypeScriptModuleKeywordNode(new SourceSpan(0, 6)), new TypeScriptNamespaceKeywordNode(new SourceSpan(0, 9))];

    for (const node of nodes) {
      Assert.isInstanceOf(node, TypeScriptModuleDeclarationKeywordNode);
      Assert.isInstanceOf(node, TypeScriptContextualKeywordNode);
    }
    Assert.areEqual("module,namespace", nodes.map(t => t.value).join(","));
  }
}
