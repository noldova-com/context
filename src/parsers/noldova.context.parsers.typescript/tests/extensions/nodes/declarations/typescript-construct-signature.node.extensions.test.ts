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
export class TypeScriptConstructSignatureNodeExtensionsTests {
  @TestData("interface I { new (this: any): I; }", "TS2681@19:9")
  @TestData("interface I { new (a: any): I; }", "")
  @TestMethod
  public refusesAThisParameter(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
