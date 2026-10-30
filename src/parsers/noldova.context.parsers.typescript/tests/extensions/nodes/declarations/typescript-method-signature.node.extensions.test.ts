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
export class TypeScriptMethodSignatureNodeExtensionsTests {
  @TestData("interface I { #m(): void }", "TS18016@14:10")
  @TestData("interface I { #m?(): void; }", "TS18016@14:12")
  @TestData("type T = { #m(): void };", "TS18016@11:10")
  @TestData("class C { x!: { #m(): void } }", "")
  @TestData("class C { m() { let x: { #m(): void }; } }", "")
  @TestData("interface I { m(): void }", "")
  @TestMethod
  public refusesAPrivateNameOutsideAClass(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
