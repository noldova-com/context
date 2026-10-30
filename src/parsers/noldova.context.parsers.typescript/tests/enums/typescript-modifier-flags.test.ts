/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptModifierFlags } from "@noldova/context.parsers.typescript/enums/typescript-modifier-flags.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptModifierFlagsTests {
  @TestMethod
  public givesEachModifierItsOwnBit(): void {
    Assert.areEqual(0, TypeScriptModifierFlags.None);
    Assert.areEqual(1, TypeScriptModifierFlags.Accessibility);
    Assert.areEqual(2, TypeScriptModifierFlags.Static);
    Assert.areEqual(4, TypeScriptModifierFlags.Readonly);
    Assert.areEqual(8, TypeScriptModifierFlags.Abstract);
    Assert.areEqual(16, TypeScriptModifierFlags.Async);
    Assert.areEqual(32, TypeScriptModifierFlags.Declare);
    Assert.areEqual(64, TypeScriptModifierFlags.Export);
    Assert.areEqual(128, TypeScriptModifierFlags.Override);
    Assert.areEqual(256, TypeScriptModifierFlags.Accessor);
    Assert.areEqual(512, TypeScriptModifierFlags.Private);
  }

  @TestMethod
  public combinesEveryModifierInAll(): void {
    Assert.areEqual(1023, TypeScriptModifierFlags.All);
  }
}
