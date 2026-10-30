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
export class TypeScriptPrivateKeywordNodeExtensionsTests {
  @TestData("abstract class C { abstract private x: number; }", "TS1243@28:7")
  @TestData("abstract class C { abstract readonly private x: number; }", "TS1029@37:7")
  @TestData("abstract class C { abstract accessor private x: number; }", "TS1029@37:7")
  @TestMethod
  public cannotBeUsedWithAnAbstractModifierBeforeIt(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("abstract class C { private abstract x: number; }", "TS1243@27:8")
  @TestData("abstract class C { public abstract x: number; }", "")
  @TestMethod
  public keepsAnAbstractModifierAfterItFromTheDeclaration(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
