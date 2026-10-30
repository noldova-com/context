/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptDirectiveArgument } from "@noldova/context.parsers.typescript/models/trivia/typescript-directive-argument.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptDirectiveArgumentTests {
  @TestMethod
  public keepsItsValueAndSpan(): void {
    const span = new SourceSpan(12, 7);
    const argument = new TypeScriptDirectiveArgument("es2015", span);

    Assert.areEqual("es2015", argument.value);
    Assert.areEqual(span, argument.span);
  }
}
