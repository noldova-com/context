/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAtNode,
  TypeScriptClassDeclarationNode,
  TypeScriptClassExpressionNode,
  TypeScriptDecoratorNode,
  TypeScriptParser,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAtNodeExtensionsTests {
  @TestMethod
  public startsAnExpressionAPrimaryExpressionAndADeclaration(): void {
    const node = new TypeScriptAtNode(new SourceSpan(0, 1));
    const parser = TypeScriptParserFixture.create("@d class C {}");
    Assert.isTrue(node.canStartTypeScriptExpression(parser));
    Assert.isTrue(node.canStartTypeScriptPrimaryExpression(parser));
    Assert.isTrue(node.isTypeScriptDeclarationStart(parser));
  }

  @TestMethod
  public dispatchesDecoratedDeclarationsAndExpressionsToTheirOwners(): void {
    const declaration = TypeScriptParser.parse("@d class C {}");
    const statement = declaration.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptClassDeclarationNode);
    Assert.isInstanceOf(statement.modifierNodes[0], TypeScriptDecoratorNode);
    Assert.areEqual(0, declaration.diagnostics.length);

    const expression = TypeScriptParser.parse("const C = @d class {};");
    const variable = expression.rootNode.children[0];
    Assert.isInstanceOf(variable, TypeScriptVariableStatementNode);
    const item = variable.declarationListNode.children[0];
    Assert.isInstanceOf(item, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(item.initializerNode, TypeScriptClassExpressionNode);
    Assert.isInstanceOf(item.initializerNode.modifierNodes[0], TypeScriptDecoratorNode);
    Assert.areEqual(0, expression.diagnostics.length);
  }

  @TestData("export default @d class {}", "")
  @TestData("export @d class C {}", "")
  @TestMethod
  public followsADefaultOrAnExport(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
