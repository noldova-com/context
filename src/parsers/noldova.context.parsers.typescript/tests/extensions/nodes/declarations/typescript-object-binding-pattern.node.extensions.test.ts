/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptObjectBindingPatternNode,
  TypeScriptParser,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptObjectBindingPatternNodeExtensionsTests {
  @TestMethod
  public startsAtItsOpeningBrace(): void {
    const statement = TypeScriptParser.parse("let {a} = b;").rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.nameNode, TypeScriptObjectBindingPatternNode);

    Assert.areEqual(declaration.nameNode.openBraceNode.span, declaration.nameNode.getTypeScriptFirstTokenSpan());
  }
}
