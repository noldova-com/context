/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ParserException } from "@noldova/context.parsers";
import { TypeScriptParserException } from "@noldova/context.parsers.typescript/exceptions/typescript-parser.exception.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptParserExceptionTests {
  @TestMethod
  public constructorPreservesTheMessageAndParserBase(): void {
    const exception = new TypeScriptParserException("failure");

    Assert.areEqual("failure", exception.message);
    Assert.isInstanceOf(exception, ParserException);
  }
}
