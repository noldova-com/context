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
export class TypeScriptReturnStatementNodeExtensionsTests {
  @TestData("declare namespace N { return 1; }", "TS1036@22:6")
  @TestMethod
  public reportsAnAmbientStatementAtItsReturnKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("return;", "TS1108@0:6")
  @TestData("if (x) return;", "TS1108@7:6")
  @TestData("{ return 1; }", "TS1108@2:6")
  @TestData("namespace N { return; }", "TS1108@14:6")
  @TestData("function f() { return; }", "")
  @TestData("const f = () => { return; };", "")
  @TestData("class C { m() { return; } }", "")
  @TestData("class C { static { function f() { return; } } }", "")
  @TestData("class C { static { const f = () => { return; }; } }", "")
  @TestMethod
  public requiresAnEnclosingFunctionBody(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("class C { static { return; } }", "TS18041@19:6")
  @TestData("class C { static { if (x) return; } }", "TS18041@26:6")
  @TestMethod
  public rejectsAReturnInAClassStaticBlock(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare namespace N { return; }", "TS1036@22:6")
  @TestData("declare namespace N { return; return; }", "TS1036@22:6|TS1108@30:6")
  @TestData("declare namespace N { x; return; return; }", "TS1036@22:1|TS1108@25:6|TS1108@33:6")
  @TestMethod
  public leavesTheFirstAmbientStatementToTheAmbientStatementCheck(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
