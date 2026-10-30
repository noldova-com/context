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
export class TypeScriptContinueStatementNodeExtensionsTests {
  @TestData("declare namespace N { continue l; }", "TS1036@22:8")
  @TestData("declare namespace N { { continue; } }", "TS1036@22:1|TS1036@24:8")
  @TestMethod
  public reportsAnAmbientStatementAtItsContinueKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("continue;", "TS1104@0:9")
  @TestData("switch (x) { case 1: continue; }", "TS1104@21:9")
  @TestData("continue l;", "TS1115@0:11")
  @TestData("l: { continue l; }", "TS1115@5:11")
  @TestData("function f() { continue; }", "TS1107@15:9")
  @TestData("class C { static { continue; } }", "TS1107@19:9")
  @TestData("l: while (x) { function f() { continue l; } }", "TS1107@30:11")
  @TestData("while (x) continue;", "")
  @TestData("do continue; while (x);", "")
  @TestData("for (x of y) continue;", "")
  @TestData("for (;;) { switch (x) { default: continue; } }", "")
  @TestData("l: while (x) { continue l; }", "")
  @TestData("l: m: while (x) { continue l; }", "")
  @TestMethod
  public requiresAnEnclosingIterationItCanContinue(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare namespace N { continue; }", "TS1036@22:8")
  @TestData("declare namespace N { continue; continue; }", "TS1036@22:8|TS1104@32:9")
  @TestData("declare namespace N { x; continue l; }", "TS1036@22:1|TS1115@25:11")
  @TestMethod
  public leavesTheFirstAmbientStatementToTheAmbientStatementCheck(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
