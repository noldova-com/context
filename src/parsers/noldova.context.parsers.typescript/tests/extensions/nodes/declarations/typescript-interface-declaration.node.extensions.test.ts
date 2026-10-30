/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptInterfaceDeclarationNode, TypeScriptMissingIdentifierNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptInterfaceDeclarationNodeExtensionsTests {
  @TestData("interface I{}", false)
  @TestData("export interface I{}", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }

  @TestData("@dec interface 1 {}", false)
  @TestData("@dec interface 1 {}", true)
  @TestData("export default interface 1 {}", false)
  @TestData("export default interface 1 {}", true)
  @TestMethod
  public reportsNoGrammarForAMissingName(content: string, isSubstatement: boolean): void {
    const node = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    const context = new TypeScriptParserContext(new Source(content));
    context.isSubstatement = isSubstatement;

    node.validateTypeScriptGrammar(context);

    Assert.areEqual(0, context.diagnosticCollector.diagnostics.length);
  }
}
