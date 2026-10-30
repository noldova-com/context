/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptObjectMemberKind } from "@noldova/context.parsers.typescript/enums/typescript-object-member-kind.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptObjectMemberKindTests {
  @TestMethod
  public givesEachMemberKindItsOwnBit(): void {
    Assert.areEqual(0, TypeScriptObjectMemberKind.None);
    Assert.areEqual(1, TypeScriptObjectMemberKind.Property);
    Assert.areEqual(2, TypeScriptObjectMemberKind.Method);
    Assert.areEqual(4, TypeScriptObjectMemberKind.Get);
    Assert.areEqual(8, TypeScriptObjectMemberKind.Set);
  }
}
