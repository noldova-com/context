/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptNamespaceExportDeclarationNode, TypeScriptParser, TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptNamespaceExportDeclarationNodeExtensionsTests {
  @TestData("export as namespace N;", false)
  @TestData("export export as namespace N;", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptNamespaceExportDeclarationNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }

  @TestData("export as namespace Global;", "TS1314")
  @TestData("export as namespace Global; export {};", "TS1315")
  @TestData("export {}; export as namespace Global;", "TS1315")
  @TestData("import value from \"module\"; export as namespace Global;", "TS1315")
  @TestData("namespace N { export as namespace Global; }", "TS1316")
  @TestData("declare namespace N { export as namespace Global; }", "TS1316")
  @TestData("declare module \"module\" { export as namespace Global; }", "TS1316")
  @TestData("declare global { export as namespace Global; }", "TS1316")
  @TestData("{ export as namespace Global; }", "TS1316")
  @TestData("function f() { export as namespace Global; }", "TS1316")
  @TestData("namespace N {} export as namespace Global;", "TS1314")
  @TestMethod
  public reportsTheSourceAGlobalExportIsWrittenIn(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const diagnostic = result.diagnostics.find(t => t.code.displayText === expectedCode);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.isDefined(diagnostic);
    Assert.areEqual(content.lastIndexOf("export as namespace"), diagnostic.location?.start);
    Assert.areEqual("export as namespace Global;".length, diagnostic.location?.length);
  }

  @TestData("@d({ a: 1, a: 2 }) export as namespace N;", "TS1184@0:41|TS1314@0:41")
  @TestData("@d({ a: 1, a: 2 }) @d({ b: 1, b: 2 }) export as namespace N;\nexport {};", "TS1184@0:60|TS1315@0:60")
  @TestData("@d(() => { with (x) {} }) export as namespace N;", "TS1184@0:48|TS1314@0:48|TS1101@11:4")
  @TestMethod
  public leavesUncheckedWhatAGlobalExportWrites(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public leavesAGlobalExportADeclarationFileModuleMayPublish(): void {
    const result = TypeScriptParser.parse("export as namespace Global; export {};", "library.d.ts", TypeScriptSourceKind.Declaration);

    Assert.areEqual(0, result.diagnostics.length);
  }
}
