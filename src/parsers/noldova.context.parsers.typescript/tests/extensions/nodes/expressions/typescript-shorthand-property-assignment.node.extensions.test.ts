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
export class TypeScriptShorthandPropertyAssignmentNodeExtensionsTests {
  @TestData("declare let a: any, b: any, c: any; ({ a } = b);", "")
  @TestData("declare let a: any, b: any, c: any; ({ a = 1 } = b);", "")
  @TestMethod
  public namesItsOwnTargetInAPattern(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var o = { a = 1 };", "TS1312@12:1")
  @TestData("({ a = 1 } = b);", "")
  @TestMethod
  public refusesAnInitializerOutsideAPattern(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
