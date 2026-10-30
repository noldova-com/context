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
export class TypeScriptTypeOperatorNodeExtensionsTests {
  @TestData("declare const a: unique symbol;", "")
  @TestData("declare const a: keyof symbol;", "")
  @TestData("declare const a: readonly symbol[];", "")
  @TestData("declare const a: unique string;", "TS1005@24:6")
  @TestData("declare const a: unique Symbol;", "TS1005@24:6")
  @TestData("declare const a: unique (symbol);", "TS1005@24:8")
  @TestData("declare const a: unique number[];", "TS1005@24:8")
  @TestData("declare const a: unique keyof symbol;", "TS1005@24:12")
  @TestData("type A = unique string;", "TS1005@16:6")
  @TestMethod
  public requiresTheSymbolKeywordAfterUnique(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
