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
export class TypeScriptAsExpressionNodeExtensionsTests {
  @TestData("declare function f([a] = [delete 1] as any): void;", "TS2371@19:23")
  @TestData("declare function f([a] = ([delete 1] as const) as any): void;", "TS2371@19:34")
  @TestData("declare function f([a] = [delete 1] as const): void;", "TS2371@19:25|TS2703@33:1")
  @TestMethod
  public checksItsOperandOnlyAsAConstAssertionWhereItsTypeIsRead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare function f({ a: b = delete 1, c } = {} as const): void;", "TS2371@19:36|TS2703@35:1")
  @TestData("declare function f({ a: b = delete 1, c } = [] as const): void;", "TS2371@19:36|TS2703@35:1")
  @TestData("declare function f({ a: b = delete 1, c } = {} as any): void;", "TS2371@19:34")
  @TestData("declare function f({ a: b = delete 1, c } = 1 as const): void;", "TS2371@19:35")
  @TestMethod
  public passesThePatternTypeToItsOperandOnlyAsAConstAssertion(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
