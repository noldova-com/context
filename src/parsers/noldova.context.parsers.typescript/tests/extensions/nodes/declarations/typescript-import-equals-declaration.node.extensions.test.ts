/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptImportEqualsDeclarationNode,
  TypeScriptImportKeywordNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportEqualsDeclarationNodeExtensionsTests {
  @TestMethod
  public doesNotInventAnExternalReferenceForIncompleteSyntax(): void {
    const node = new TypeScriptImportEqualsDeclarationNode(
      new TypeScriptImportKeywordNode(new SourceSpan(0, 6)), new TypeScriptIdentifierNode("X", new SourceSpan(7, 1)), new SourceSpan(0, 8),
      new TypeScriptMissingIdentifierNode(new SourceSpan(8, 0)));
    Assert.isFalse(node.isTypeScriptExternalModuleIndicator());
  }

  @TestData("import X=A.B;", false)
  @TestData("import X=require('m');", true)
  @TestData("export import X=A.B;", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportEqualsDeclarationNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }
}
