/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptTypeParameterAnnotations } from "@noldova/context.parsers.typescript/enums/typescript-type-parameter-annotations.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTypeParameterAnnotationsTests {
  @TestMethod
  public givesEachAnnotationItsOwnBit(): void {
    Assert.areEqual(0, TypeScriptTypeParameterAnnotations.None);
    Assert.areEqual(1, TypeScriptTypeParameterAnnotations.Const);
    Assert.areEqual(2, TypeScriptTypeParameterAnnotations.In);
    Assert.areEqual(4, TypeScriptTypeParameterAnnotations.Out);
  }

  @TestMethod
  public combinesInAndOutAsVariance(): void {
    Assert.areEqual(6, TypeScriptTypeParameterAnnotations.Variance);
  }
}
