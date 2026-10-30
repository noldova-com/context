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
export class TypeScriptTypeAssertionExpressionNodeExtensionsTests {
  @TestData("declare namespace N { <any>a; }", "TS1036@22:1")
  @TestData("declare namespace N { <any><unknown>a; }", "TS1036@22:1")
  @TestMethod
  public reportsAnAmbientStatementAtItsLessThan(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare let a: any;\n(<any>a) = 1;", "")
  @TestData("declare let a: any;\n(<any>(<unknown>a)) = 1;", "")
  @TestData("(<any>1) = 1;", "TS2364@0:8")
  @TestData("declare let a: any;\nfor (<any>a in {}) {}", "")
  @TestData("for (<any>1 in {}) {}", "TS2406@5:6")
  @TestMethod
  public assignsThroughItsOperand(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare function f([a] = <any>[delete 1]): void;", "TS2371@19:21")
  @TestData("declare function f([a] = <const>[delete 1]): void;", "TS2371@19:23|TS2703@40:1")
  @TestMethod
  public checksItsOperandOnlyAsAConstAssertionWhereItsTypeIsRead(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare function f({ a: b = delete 1, c } = <const>{}): void;", "TS2371@19:34|TS2703@35:1")
  @TestData("declare function f({ a: b = delete 1, c } = <const>[]): void;", "TS2371@19:34|TS2703@35:1")
  @TestData("declare function f({ a: b = delete 1, c } = <any>{}): void;", "TS2371@19:32")
  @TestData("declare function f({ a: b = delete 1, c } = <const>1): void;", "TS2371@19:33")
  @TestMethod
  public passesThePatternTypeToItsOperandOnlyAsAConstAssertion(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
