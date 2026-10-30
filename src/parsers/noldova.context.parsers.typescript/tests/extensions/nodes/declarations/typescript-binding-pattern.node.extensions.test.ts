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
export class TypeScriptBindingPatternNodeExtensionsTests {
  @TestData("var [...a,] = b;", "TS1013@9:1")
  @TestData("var {...a,} = b;", "TS1013@9:1")
  @TestData("var [...a = 1] = b;", "TS1186@10:1")
  @TestData("var { a } = b, [c] = d;", "")
  @TestMethod
  public reportsARestElementThatEndsNoPattern(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("let [let] = a;", "TS1212@5:3|TS2480@5:3")
  @TestData("let {a: let} = b;", "TS1212@8:3|TS2480@8:3")
  @TestData("var [let] = a;", "TS1212@5:3")
  @TestMethod
  public reportsALetNameEachElementBinds(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
