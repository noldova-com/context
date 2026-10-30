/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptContextFlagsTests {
  @TestMethod
  public keepsAwaitAndYieldAsIndependentFlags(): void {
    Assert.areEqual(0, TypeScriptContextFlags.None);
    Assert.areEqual(1, TypeScriptContextFlags.Await);
    Assert.areEqual(2, TypeScriptContextFlags.Yield);
    Assert.areEqual(3, TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield);
  }

  @TestMethod
  public givesEveryOtherContextItsOwnFlag(): void {
    Assert.areEqual(4, TypeScriptContextFlags.Decorator);
    Assert.areEqual(8, TypeScriptContextFlags.TopLevelAwait);
    Assert.areEqual(16, TypeScriptContextFlags.ConditionalTrueBranch);
    Assert.areEqual(32, TypeScriptContextFlags.DisallowConditionalTypes);
    Assert.areEqual(64, TypeScriptContextFlags.ClassBodyRecovery);
    Assert.areEqual(128, TypeScriptContextFlags.DisallowIn);
  }
}
