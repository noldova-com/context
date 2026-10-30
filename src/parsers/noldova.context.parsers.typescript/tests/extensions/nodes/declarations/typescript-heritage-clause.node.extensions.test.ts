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
export class TypeScriptHeritageClauseNodeExtensionsTests {
  @TestData("interface A {} interface B {} class C implements A, {}", "TS1009@50:1")
  @TestData("declare class B {} class C extends B, {}", "TS1009@36:1")
  @TestData("interface A {} interface I extends A, {}", "TS1009@36:1")
  @TestData("interface A {} const C = class implements A, {};", "TS1009@43:1")
  @TestData("interface A {} interface B {} class C implements A, B {}", "")
  @TestMethod
  public refusesATrailingComma(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("interface A {} class C implements {}", "TS1097@33:0")
  @TestData("class C extends {}", "TS1097@15:0")
  @TestData("interface I extends {}", "TS1097@19:0")
  @TestMethod
  public refusesAnEmptyListAfterItsKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
