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
export class TypeScriptSpreadElementNodeExtensionsTests {
  @TestData("declare let a: any, b: any, c: any; [...a] = b;", "")
  @TestData("declare let a: any, b: any, c: any; [...a = 1] = b;", "TS1186@42:1")
  @TestData("declare let a: any, b: any, c: any; [...a + 1] = b;", "TS2364@40:5")
  @TestMethod
  public takesWhatRemainsIntoAReference(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
