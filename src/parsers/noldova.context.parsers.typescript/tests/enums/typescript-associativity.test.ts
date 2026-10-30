/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptAssociativityTests {
  @TestMethod
  public distinguishesOperatorGroupingDirections(): void {
    Assert.areEqual("None", TypeScriptAssociativity.None);
    Assert.areEqual("Left", TypeScriptAssociativity.Left);
    Assert.areEqual("Right", TypeScriptAssociativity.Right);
  }
}
