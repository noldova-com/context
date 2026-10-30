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
export class TypeScriptPropertySignatureNodeExtensionsTests {
  @TestData("interface I { #a: string }", "TS18016@14:2")
  @TestData("type T = { #a: string };", "TS18016@11:2")
  @TestData("class C { x!: { #a: string } }", "TS18016@16:2")
  @TestData("interface I { a: string }", "")
  @TestMethod
  public refusesAPrivateNameEvenInsideAClass(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("interface I { a: number = 1 }", "TS1246@26:1")
  @TestData("interface I { a?: number = 1 }", "TS1246@27:1")
  @TestData("type T = { a: number = 1 };", "TS1247@23:1")
  @TestData("type T = { a?: number = 1 };", "TS1247@24:1")
  @TestData("declare let a: any; interface I { [a + \"\"]: number = 1 }", "")
  @TestData("declare let a: any; type T = { [a + \"\"]: number = 1 };", "")
  @TestData("interface I { a: number }", "")
  @TestMethod
  public refusesAnInitializerByItsContainer(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
