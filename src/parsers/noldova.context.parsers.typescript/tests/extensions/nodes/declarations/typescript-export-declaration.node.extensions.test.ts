/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptExportDeclarationNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptExportDeclarationNodeExtensionsTests {
  @TestData("export {};", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportDeclarationNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }

  @TestData("namespace N { export {}; }", "TS1194@14:10")
  @TestData("namespace N { export { value }; }", "TS1194@14:17")
  @TestData("namespace N { export * from 'm'; }", "TS1194@28:3")
  @TestData("namespace N { export { value } from 'm'; }", "TS1194@36:3")
  @TestData("namespace A.B.C { export {}; }", "TS1194@18:10")
  @TestData("declare namespace N { export * from 'm'; }", "TS1194@36:3")
  @TestData("declare namespace N { export {}; }", "")
  @TestData("declare module 'pkg' { export {}; }", "")
  @TestData("declare global { export {}; }", "")
  @TestData("namespace N { { export {}; } }", "TS1233@16:6")
  @TestData("namespace N { export const value = 1; }", "")
  @TestData("export {};", "")
  @TestMethod
  public reportsAnExportDeclarationWrittenInANamespace(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
