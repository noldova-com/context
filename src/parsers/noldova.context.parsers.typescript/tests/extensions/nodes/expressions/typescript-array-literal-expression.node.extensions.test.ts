/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptArrayLiteralExpressionNodeExtensionsTests {
  @TestData("declare let a: any, b: any, c: any; [...a,] = b;", "TS1013@41:1")
  @TestData("declare let a: any, b: any, c: any; [a, ...b = 1] = c;", "TS1186@45:1")
  @TestData("declare let a: any, b: any, c: any; [{ a = 1 }] = b;", "")
  @TestData("declare let a: any, b: any, c: any; [a, b + 1] = c;", "TS2364@40:5")
  @TestMethod
  public readsAnAssignedLiteralAsAPattern(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("for ([a] in x) {}", "TS2491@5:3")
  @TestData("for ([a] of x) {}", "")
  @TestData("for ([f()] of x) {}", "TS2364@6:3")
  @TestMethod
  public destructuresOnlyAForOfInitializer(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
