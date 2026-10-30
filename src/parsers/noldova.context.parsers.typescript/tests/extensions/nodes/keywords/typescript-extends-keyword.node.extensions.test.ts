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
export class TypeScriptExtendsKeywordNodeExtensionsTests {
  @TestData("extends;", "TS1128@0:7")
  @TestData("extends {}", "TS1128@0:7")
  @TestData("{ extends; }", "TS1128@2:7")
  @TestData("function f() { extends; }", "TS1128@15:7")
  @TestData("namespace N { extends; }", "TS1128@14:7")
  @TestData("class C {}\nextends C;", "TS1128@11:7")
  @TestData("declare let x: any;\nswitch (x) { case 1: extends; }", "TS1129@41:7")
  @TestMethod
  public reportsAnExtendsThatStartsAStatement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
