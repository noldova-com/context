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
export class TypeScriptEnumMemberNodeExtensionsTests {
  @TestData("enum E { #a }", "TS18024@9:2")
  @TestData("enum E { a, b }", "")
  @TestMethod
  public refusesAPrivateName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare let a: any; enum E { [a] }", "TS1164@29:3")
  @TestData("declare let a: any; enum E { [a + \"\"] = 1 }", "TS1164@29:8")
  @TestData("enum E { [\"a\"] }", "")
  @TestData("enum E { [`a`] }", "")
  @TestData("enum E { \"a\" }", "")
  @TestMethod
  public refusesAComputedNameOtherThanALiteral(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
