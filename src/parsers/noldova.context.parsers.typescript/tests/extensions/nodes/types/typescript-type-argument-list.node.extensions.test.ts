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
export class TypeScriptTypeArgumentListNodeExtensionsTests {
  @TestData("declare let x: Array<string>;", "")
  @TestData("declare let x: Array<>;", "TS1099@20:2")
  @TestData("declare let x: Array< >;", "TS1099@20:3")
  @TestData("declare function f<T>(): void; f<>();", "TS1099@32:2")
  @TestData("declare function f<T>(): void; const g = f<>;", "TS1099@42:2")
  @TestData("declare class B<T> {} class C extends B<> {}", "TS1099@39:2")
  @TestData("interface I extends Array<> {}", "TS1099@25:2")
  @TestData("declare let a: any; let x: typeof a<>;", "TS1099@35:2")
  @TestMethod
  public reportsAnEmptyList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare let x: Map<string, number>;", "")
  @TestData("declare let x: Array<string,>;", "TS1009@27:1")
  @TestData("declare let x: Array<string, >;", "TS1009@27:1")
  @TestData("declare let x: Map<string, number,>;", "TS1009@33:1")
  @TestData("declare function f<T>(): void; f<string,>();", "TS1009@39:1")
  @TestData("declare function f<T>(): void; const g = f<string,>;", "TS1009@49:1")
  @TestData("declare class B<T> {} class C extends B<string,> {}", "TS1009@46:1")
  @TestMethod
  public reportsATrailingComma(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
