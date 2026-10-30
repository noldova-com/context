/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptDecoratorSupport } from "@noldova/context.parsers.typescript/enums/typescript-decorator-support.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDecoratorSupportTests {
  @TestMethod
  public namesEachWayADeclarationTakesDecorators(): void {
    Assert.areEqual("Supported", TypeScriptDecoratorSupport.Supported);
    Assert.areEqual("Unsupported", TypeScriptDecoratorSupport.Unsupported);
    Assert.areEqual("Overload", TypeScriptDecoratorSupport.Overload);
  }
}
