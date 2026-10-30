/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser, TypeScriptVariableStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptVariableStatementNodeExtensionsTests {
  @TestData("const x=1;", false)
  @TestData("export const x=1;", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptVariableStatementNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }

  @TestData("export using value = resource;", "TS1491", "export", "'export' modifier cannot appear on a 'using' declaration.")
  @TestData("declare using value;", "TS1491", "declare", "'declare' modifier cannot appear on a 'using' declaration.")
  @TestData("export await using value = resource;", "TS1495", "export", "'export' modifier cannot appear on an 'await using' declaration.")
  @TestData("declare await using value;", "TS1495", "declare", "'declare' modifier cannot appear on an 'await using' declaration.")
  @TestData("export declare using value;", "TS1491", "export", "'export' modifier cannot appear on a 'using' declaration.")
  @TestMethod
  public reportsEveryModifierWrittenOnAResourceDeclaration(content: string, expectedCode: string, expectedText: string, expectedMessage: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(expectedCode, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), result.diagnostics[0]?.location?.start);
    Assert.areEqual(expectedText.length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(expectedMessage, result.diagnostics[0]?.message.text);
  }

  @TestData("using value = resource;")
  @TestData("await using value = resource;")
  @TestData("export const value = 1;")
  @TestData("declare const value = 1;")
  @TestMethod
  public acceptsTheModifiersAVariableDeclarationCarries(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }
}
