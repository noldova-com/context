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
export class TypeScriptBreakStatementNodeExtensionsTests {
  @TestData("declare namespace N { break l; }", "TS1036@22:5")
  @TestData("declare namespace N { { break; } }", "TS1036@22:1|TS1036@24:5")
  @TestMethod
  public reportsAnAmbientStatementAtItsBreakKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("break;", "TS1105@0:6")
  @TestData("break l;", "TS1116@0:8")
  @TestData("function f() { break; }", "TS1107@15:6")
  @TestData("class C { static { break; } }", "TS1107@19:6")
  @TestData("while (x) { function f() { break; } }", "TS1107@27:6")
  @TestData("l: while (x) { function f() { break l; } }", "TS1107@30:8")
  @TestData("while (x) break;", "")
  @TestData("switch (x) { case 1: break; }", "")
  @TestData("for (;;) { switch (x) { default: break; } }", "")
  @TestData("l: { break l; }", "")
  @TestData("l: if (x) break l;", "")
  @TestData("m: while (x) { l: { break m; } }", "")
  @TestMethod
  public requiresAnEnclosingTargetItCanBreakOutOf(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare namespace N { break; }", "TS1036@22:5")
  @TestData("declare namespace N { break; break; }", "TS1036@22:5|TS1105@29:6")
  @TestData("declare namespace N { x; break l; }", "TS1036@22:1|TS1116@25:8")
  @TestMethod
  public leavesTheFirstAmbientStatementToTheAmbientStatementCheck(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
