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
export class TypeScriptObjectLiteralExpressionNodeExtensionsTests {
  @TestData("declare let a: any, b: any, c: any; ({ ...a, } = b);", "TS1013@43:1")
  @TestData("declare let a: any, b: any, c: any; ({ a = 1 } = b);", "")
  @TestData("declare let a: any, b: any, c: any; ({ a = 1 });", "TS1312@41:1")
  @TestData("declare let a: any, b: any, c: any; ({ a: 1, a: 2 });", "TS1117@45:1")
  @TestMethod
  public readsAnAssignedLiteralAsAPattern(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var o = { a: 1, a: 2 };", "TS1117@16:1")
  @TestData("var o = { get a() { return 1; }, a: 2 };", "TS1119@33:1")
  @TestData("var o = { a: 1, m() {}, get b() { return 1; }, set b(v) {} };", "")
  @TestMethod
  public reportsAMemberNameWrittenTwice(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("for ({a} in x) {}", "TS2491@5:3")
  @TestData("for ({a} of x) {}", "")
  @TestData("for ({a: f()} of x) {}", "TS2364@9:3")
  @TestMethod
  public destructuresOnlyAForOfInitializer(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
