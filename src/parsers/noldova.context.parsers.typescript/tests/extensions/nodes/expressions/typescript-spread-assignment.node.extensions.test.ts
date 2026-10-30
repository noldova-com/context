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
export class TypeScriptSpreadAssignmentNodeExtensionsTests {
  @TestData("declare let a: any, b: any, c: any; ({ ...a.b } = c);", "")
  @TestData("declare let a: any, b: any, c: any; ({ ...a + 1 } = c);", "TS2701@42:5")
  @TestMethod
  public takesWhatRemainsIntoAReference(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
