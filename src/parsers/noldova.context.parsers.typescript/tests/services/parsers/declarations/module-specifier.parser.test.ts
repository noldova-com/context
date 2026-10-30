/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptCallExpressionNode,
  TypeScriptImportDeclarationNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ModuleSpecifierParserTests {
  @TestMethod
  public retainsNonLiteralSpecifierSyntaxAndReportsIt(): void {
    const result = TypeScriptParser.parse("import {} from getModule();");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isInstanceOf(node.moduleSpecifierNode, TypeScriptCallExpressionNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1141", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(15, result.diagnostics[0]?.location?.start);
  }

  @TestMethod
  public leavesTheTerminatorAfterAMissingModuleSpecifier(): void {
    const result = TypeScriptParser.parse("import {} from ;");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptImportDeclarationNode);
    Assert.isInstanceOf(node.moduleSpecifierNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(0, node.moduleSpecifierNode.span.length);
    Assert.isDefined(node.semicolonNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
  }
}
