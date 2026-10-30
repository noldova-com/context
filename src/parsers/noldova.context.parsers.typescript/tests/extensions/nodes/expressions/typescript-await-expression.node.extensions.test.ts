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
export class TypeScriptAwaitExpressionNodeExtensionsTests {
  @TestData("declare namespace N { await a; }", "TS1036@22:5|TS1308@22:5")
  @TestData("declare module \"m\" { await a; }", "TS1036@21:5|TS1308@21:5")
  @TestMethod
  public reportsAnAmbientStatementAtItsAwaitKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("async function f([a] = await ([delete 1] as any)): Promise<void>;\nasync function f() {}", "TS2371@17:31")
  @TestData("async function f([a] = await [delete 1]): Promise<void>;\nasync function f() {}", "TS2371@17:22|TS2703@37:1")
  @TestMethod
  public skipsWhatItsOperandSkipsWhereItsTypeIsRead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("async function f({ a: b = delete 1, c } = await {}): Promise<void>;\nasync function f() {}", "TS2371@17:33|TS2703@33:1")
  @TestData("async function f({ a: b = delete 1, c } = await 1): Promise<void>;\nasync function f() {}", "TS2371@17:32")
  @TestMethod
  public passesThePatternTypeToItsOperand(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
