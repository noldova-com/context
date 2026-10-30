/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptSourceKindTests {
  @TestMethod
  public exposesOnlyTheTwoExplicitSourceInterpretations(): void {
    Assert.areEqual("Code", TypeScriptSourceKind.Code);
    Assert.areEqual("Declaration", TypeScriptSourceKind.Declaration);
    Assert.areEqual(2, Object.keys(TypeScriptSourceKind).length);
  }
}
