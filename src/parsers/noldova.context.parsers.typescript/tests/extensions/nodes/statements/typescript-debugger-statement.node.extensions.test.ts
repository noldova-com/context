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
export class TypeScriptDebuggerStatementNodeExtensionsTests {
  @TestData("declare namespace N { debugger; }", "TS1036@22:8")
  @TestData("declare namespace N { /* note */ debugger; }", "TS1036@33:8")
  @TestMethod
  public reportsAnAmbientStatementAtItsDebuggerKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
