/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptParserException } from "@noldova/context.parsers.typescript/exceptions/typescript-parser.exception.js";
import { TypeScriptRecursionLimitException } from "@noldova/context.parsers.typescript/exceptions/typescript-recursion-limit.exception.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptRecursionLimitExceptionTests {
  @TestMethod
  public preservesTheInterruptedSourceSpan(): void {
    const span = new SourceSpan(12, 3);
    const exception = new TypeScriptRecursionLimitException(span);

    Assert.isInstanceOf(exception, TypeScriptParserException);
    Assert.areEqual(span, exception.span);
    Assert.areEqual("TypeScriptRecursionLimitException", exception.name);
    Assert.areEqual("The TypeScript parser recursion limit was reached.", exception.message);
  }
}
