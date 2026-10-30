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
export class TypeScriptConditionalExpressionNodeExtensionsTests {
  @TestData("declare namespace N { a ? 1 : 2; }", "TS1036@22:1")
  @TestData("declare namespace N { typeof a ? 1 : 2; }", "TS1036@22:6")
  @TestData("declare namespace N { ++a ? 1 : 2; }", "TS1036@22:2")
  @TestData("declare namespace N { new A() ? 1 : 2; }", "TS1036@22:3")
  @TestMethod
  public reportsAnAmbientStatementAtTheFirstTokenOfItsCondition(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare let x: boolean;\ndeclare function f({ a: b = delete 1, c } = x ? {} : 1): void;", "TS2371@43:35|TS2703@59:1")
  @TestData("declare let x: boolean;\ndeclare function f({ a: b = delete 1, c } = x ? 1 : {}): void;", "TS2371@43:35|TS2703@59:1")
  @TestData("declare let x: boolean;\ndeclare function f({ a: b = delete 1, c } = x ? 1 : 2): void;", "TS2371@43:34")
  @TestMethod
  public passesThePatternTypeToEitherBranch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
