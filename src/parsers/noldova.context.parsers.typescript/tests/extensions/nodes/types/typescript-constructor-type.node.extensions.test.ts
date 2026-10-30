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
export class TypeScriptConstructorTypeNodeExtensionsTests {
  @TestData("type T = new (this: any) => void;", "TS2681@14:9")
  @TestData("type T = new (a: any) => void;", "")
  @TestMethod
  public refusesAThisParameter(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("x = (a): new () => T => a;", "")
  @TestData("x = (a): new => T => a;", "TS1005@7:1|TS1109@13:2")
  @TestData("x = (a): new () => => a;", "TS1005@7:1|TS1109@14:1|TS1005@16:2|TS1128@19:2")
  @TestMethod
  public blocksAnAmbiguousArrowHeadWhereItsParametersOrReturnTypeAreMissing(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
