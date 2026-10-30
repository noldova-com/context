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
export class TypeScriptTypePredicateNodeExtensionsTests {
  @TestData("function f(x: any): x is string { return true; }", "")
  @TestData("function f(x?: any): x is string { return true; }", "")
  @TestData("function f(x: any): asserts x {}", "")
  @TestData("function f(x: any, { x: y }: any): x is string { return true; }", "")
  @TestData("function f({ x }: any, x: any): x is string { return true; }", "")
  @TestData("function f(this: any): this is string { return true; }", "")
  @TestData("function f(...x: any[]): this is any { return true; }", "")
  @TestData("class C { m(): this is C { return true; } }", "")
  @TestMethod
  public acceptsThisOrANamedParameter(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f(...x: any[]): x is string[] { return true; }", "TS1229@25:1")
  @TestData("function f(a: any, ...x: any[]): x is string[] { return true; }", "TS1229@33:1")
  @TestData("function f(this: any, ...x: any[]): x is any[] { return true; }", "TS1229@36:1")
  @TestData("function f(...x: any[]): asserts x {}", "TS1229@33:1")
  @TestData("type F = (...x: any[]) => x is any[];", "TS1229@26:1")
  @TestMethod
  public refusesARestParameter(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f({ x }: any): x is string { return true; }", "TS1230@24:1")
  @TestData("function f([x]: any): x is string { return true; }", "TS1230@22:1")
  @TestData("function f([, x]: any): x is string { return true; }", "TS1230@24:1")
  @TestData("function f({ a: [x] }: any): x is string { return true; }", "TS1230@29:1")
  @TestData("function f({ ...x }: any): x is string { return true; }", "TS1230@27:1")
  @TestData("function f(...[x]: any[]): x is any { return true; }", "TS1230@27:1")
  @TestData("function f({ x }: any, x2: any): x is string { return true; }", "TS1230@33:1")
  @TestMethod
  public refusesABindingPatternElement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f(y: any): x is string { return true; }", "TS1225@20:1")
  @TestData("function f({ x: y }: any): x is string { return true; }", "TS1225@27:1")
  @TestData("function f(): asserts x {}", "TS1225@22:1")
  @TestData("function f(y: any): asserts x is string {}", "TS1225@28:1")
  @TestData("declare function f(y: any): x is string;", "TS1225@28:1")
  @TestData("type F = (y: any) => x is string;", "TS1225@21:1")
  @TestData("interface I { m(y: any): x is string; }", "TS1225@25:1")
  @TestData("interface I { (y: any): x is string; }", "TS1225@24:1")
  @TestData("const f = (y: any): x is string => true;", "TS1225@20:1")
  @TestData("class C { m(y: any): x is string { return true; } }", "TS1225@21:1")
  @TestData("let o = { m(y: any): x is string { return true; } };", "TS1225@21:1")
  @TestMethod
  public reportsANameNoParameterDeclares(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
