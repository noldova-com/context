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
export class TypeScriptComputedPropertyNameNodeExtensionsTests {
  @TestData("({ a: 1, [\"a\"]: 2 });", "TS1117@9:5")
  @TestData("({ [\"a\"]: 1, [\"a\"]: 2 });", "TS1117@13:5")
  @TestData("({ a: 1, [1]: 2, 1: 3 });", "TS1117@17:1")
  @TestData("({ [0x1]: 1, 1: 2 });", "TS1117@13:1")
  @TestData("declare let a: any; ({ a: 1, [a]: 2 });", "")
  @TestMethod
  public namesAPropertyOnlyByALiteral(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare let a: any, b: any; ({ [a++, b]: 1 });", "TS1171@32:6")
  @TestData("declare let a: any, b: any; ({ [a++, b]() {} });", "TS1171@32:6")
  @TestData("declare let a: any, b: any; ({ get [a++, b]() { return 1; } });", "TS1171@36:6")
  @TestData("declare let a: any, b: any; class C { get [a++, b]() { return 1; } }", "TS1171@43:6")
  @TestData("declare let a: any, b: any; ({ [(a++, b)]: 1 });", "")
  @TestData("declare let a: any, b: any; ({ [a + b]: 1 });", "")
  @TestMethod
  public refusesACommaExpression(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
