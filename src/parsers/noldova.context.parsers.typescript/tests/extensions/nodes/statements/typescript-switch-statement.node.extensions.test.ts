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
export class TypeScriptSwitchStatementNodeExtensionsTests {
  @TestData("declare namespace N { switch (x) {} }", "TS1036@22:6")
  @TestData("declare namespace N { switch (x) { default: } }", "TS1036@22:6")
  @TestMethod
  public reportsAnAmbientStatementAtItsSwitchKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("switch (x) { default: case 1: default: }", "TS1113@30:8")
  @TestData("switch (x) { default: default: default: }", "TS1113@22:8")
  @TestData("switch (x) { case 1: default: }", "")
  @TestData("switch (x) { case 1: break; }", "")
  @TestData("switch (x) {}", "")
  @TestMethod
  public reportsOnlyTheFirstRepeatedDefaultClause(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
