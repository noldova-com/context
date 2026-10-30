/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptMissingDeclarationNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptMissingDeclarationNodeExtensionsTests {
  @TestData("@d", false)
  @TestData("export @d", true)
  @TestData("@d export readonly", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptMissingDeclarationNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }

  @TestMethod
  public readsAsALeftHandSideExpression(): void {
    const node = new TypeScriptMissingDeclarationNode([], new SourceSpan(0, 0));

    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
  }
}
