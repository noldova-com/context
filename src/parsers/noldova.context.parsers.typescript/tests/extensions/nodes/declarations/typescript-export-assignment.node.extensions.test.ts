/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptExportAssignmentNode, TypeScriptParser, TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptExportAssignmentNodeExtensionsTests {
  @TestData("export default value;", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportAssignmentNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }

  @TestData("namespace N { export default value; }", "export default value;")
  @TestData("namespace N { export default 1; }", "export default 1;")
  @TestMethod
  public reportsADefaultExportANamespaceBodyHolds(content: string, expectedText: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1319", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), result.diagnostics[0]?.location?.start);
    Assert.areEqual(expectedText.length, result.diagnostics[0]?.location?.length);
    Assert.areEqual("A default export can only be used in an ECMAScript-style module.", result.diagnostics[0]?.message.text);
  }

  @TestData("export default value;")
  @TestData("declare module \"module\" { export default value; }")
  @TestData("declare global { export default value; }")
  @TestMethod
  public acceptsADefaultExportItsSourceMayHold(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestData("namespace N { export = value; }", "TS1063")
  @TestData("declare namespace N { export = value; }", "TS1063")
  @TestData("declare module \"m\" { namespace N { export = value; } }", "TS1063")
  @TestData("declare module \"m\" { export = value; }", "")
  @TestData("declare global { export = value; }", "")
  @TestData("export = value;", "TS1203")
  @TestMethod
  public reportsAnExportAssignmentByWhatHoldsIt(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => t.code.displayText).join("|"));
  }

  @TestMethod
  public acceptsAnExportAssignmentADeclarationFileWrites(): void {
    const result = TypeScriptParser.parse("export = value;", "module.d.ts", TypeScriptSourceKind.Declaration);

    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public withholdsTheNamespaceReportWhereTheSourceFailedToParse(): void {
    Assert.areEqual("TS1128@31:1", TypeScriptDiagnosticsFixture.parse("namespace N { export = value; })"));
  }

  @TestData("module.cts", TypeScriptSourceKind.Code, "")
  @TestData("module.mts", TypeScriptSourceKind.Code, "TS1203")
  @TestData("module.d.cts", TypeScriptSourceKind.Declaration, "")
  @TestData("module.d.mts", TypeScriptSourceKind.Declaration, "TS1203")
  @TestMethod
  public readsTheModuleFormatFromTheFileName(identity: string, kind: TypeScriptSourceKind, expected: string): void {
    const result = TypeScriptParser.parse("export = value;", identity, kind);

    Assert.areEqual(expected, result.diagnostics.map(t => t.code.displayText).join("|"));
  }
}
