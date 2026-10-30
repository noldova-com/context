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
export class TypeScriptPropertyAssignmentNodeExtensionsTests {
  @TestData("declare let a: any, b: any, c: any; ({ a: { b = 1 } } = c);", "")
  @TestData("declare let a: any, b: any, c: any; ({ a: b + 1 } = c);", "TS2364@42:5")
  @TestMethod
  public readsItsValueAsTheTargetOfAPattern(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var o = { 1n: 1 };", "TS1539@10:2")
  @TestMethod
  public refusesABigIntName(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
