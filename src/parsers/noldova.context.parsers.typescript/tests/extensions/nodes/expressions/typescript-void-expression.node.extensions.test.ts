/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptVoidExpressionNodeExtensionsTests {
  @TestData("declare namespace N { void 0; }", "TS1036@22:4")
  @TestData("declare namespace N { void typeof a; }", "TS1036@22:4")
  @TestMethod
  public reportsAnAmbientStatementAtItsVoidKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
