/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptArrowHeadKind } from "@noldova/context.parsers.typescript/enums/typescript-arrow-head-kind.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptArrowHeadKindTests {
  @TestMethod
  public distinguishesRecognitionFromAnAmbiguousPrefix(): void {
    Assert.areEqual("NotArrow", TypeScriptArrowHeadKind.NotArrow);
    Assert.areEqual("Arrow", TypeScriptArrowHeadKind.Arrow);
    Assert.areEqual("Ambiguous", TypeScriptArrowHeadKind.Ambiguous);
    Assert.areEqual("Parameters", TypeScriptArrowHeadKind.Parameters);
  }
}
