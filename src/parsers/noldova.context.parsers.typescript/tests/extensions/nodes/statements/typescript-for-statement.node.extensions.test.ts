/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptForStatementNodeExtensionsTests {
  @TestData("declare namespace N { for (;;) {} }", "TS1036@22:3")
  @TestMethod
  public reportsAnAmbientStatementAtItsForKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (const x; ;) {}", "TS1155@11:1")
  @TestData("for (const [a]; ;) {}", "TS1182@11:3")
  @TestData("for (let x = 1, y = 2; ;) {}", "")
  @TestMethod
  public requiresTheInitializersItsHeaderDeclares(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare namespace N { x; for (using a = 1; ;) {} }", "TS1036@22:1|TS1545@30:11")
  @TestData("declare namespace N { x; for (await using a = 1; ;) {} }", "TS1036@22:1|TS1546@30:17")
  @TestData("declare namespace N { x; for (using a; ;) {} }", "TS1036@22:1|TS1545@30:7")
  @TestData("function f() { for (using a = b; ;) {} }", "")
  @TestMethod
  public rejectsAResourceDeclarationHeaderInAnAmbientContext(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
