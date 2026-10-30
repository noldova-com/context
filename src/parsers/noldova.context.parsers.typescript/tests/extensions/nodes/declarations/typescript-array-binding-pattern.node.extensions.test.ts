/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptArrayBindingPatternNode,
  TypeScriptParser,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptArrayBindingPatternNodeExtensionsTests {
  @TestMethod
  public startsAtItsOpeningBracket(): void {
    const statement = TypeScriptParser.parse("let [a] = b;").rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.nameNode, TypeScriptArrayBindingPatternNode);

    Assert.areEqual(declaration.nameNode.openBracketNode.span, declaration.nameNode.getTypeScriptFirstTokenSpan());
  }
}
