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
export class TypeScriptElseKeywordNodeExtensionsTests {
  @TestData("else;", "TS1128@0:4")
  @TestData("else {}", "TS1128@0:4")
  @TestData("{ else; }", "TS1128@2:4")
  @TestData("function f() { else; }", "TS1128@15:4")
  @TestData("namespace N { else; }", "TS1128@14:4")
  @TestData("declare let x: any;\nif (x) {} else {} else {}", "TS1128@38:4")
  @TestData("declare let x: any;\nswitch (x) { case 1: else; }", "TS1129@41:4")
  @TestMethod
  public reportsAnElseThatStartsAStatement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
