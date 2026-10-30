/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptModifierTarget } from "@noldova/context.parsers.typescript/enums/typescript-modifier-target.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptModifierTargetTests {
  @TestMethod
  public namesEachPlaceAModifierIsWritten(): void {
    Assert.areEqual("ModuleElement", TypeScriptModifierTarget.ModuleElement);
    Assert.areEqual("ClassElement", TypeScriptModifierTarget.ClassElement);
    Assert.areEqual("TypeMember", TypeScriptModifierTarget.TypeMember);
    Assert.areEqual("Parameter", TypeScriptModifierTarget.Parameter);
  }
}
