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
export class TypeScriptWithStatementNodeExtensionsTests {
  @TestData("declare namespace N { with (x) {} }", "TS1036@22:4|TS1101@22:4")
  @TestMethod
  public reportsAnAmbientStatementAtItsWithKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("with (x) {}", "TS1101@0:4")
  @TestData("if (x) with (y) {}", "TS1101@7:4")
  @TestData("with (x) with (y) {}", "TS1101@0:4|TS1101@9:4")
  @TestData("for (var v = function () { with (x) {} } in y) {}", "TS1189@9:1|TS1101@27:4")
  @TestMethod
  public rejectsEveryWithStatementEvenWhereGrammarIsUnchecked(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
