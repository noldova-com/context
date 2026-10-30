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
export class TypeScriptExpressionStatementNodeExtensionsTests {
  @TestData("declare namespace N { x; }", "TS1036@22:1")
  @TestData("declare namespace N { run(); }", "TS1036@22:3")
  @TestData("declare namespace N { new C(); }", "TS1036@22:3")
  @TestData("declare namespace N { a.b.c; }", "TS1036@22:1")
  @TestData("declare namespace N { a + b; }", "TS1036@22:1")
  @TestData("declare namespace N { x = 1; }", "TS1036@22:1")
  @TestData("declare namespace N { x++; }", "TS1036@22:1")
  @TestData("declare namespace N { !x; }", "TS1036@22:1")
  @TestData("declare namespace N { (x); }", "TS1036@22:1")
  @TestData("declare namespace N { a ? b : c; }", "TS1036@22:1")
  @TestMethod
  public reportsAnAmbientStatementAtTheFirstTokenOfItsExpression(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
