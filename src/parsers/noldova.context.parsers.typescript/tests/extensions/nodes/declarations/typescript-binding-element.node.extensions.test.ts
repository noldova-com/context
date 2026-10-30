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
export class TypeScriptBindingElementNodeExtensionsTests {
  @TestData("declare const o: any; let [let] = o;", "TS1212@27:3|TS2480@27:3")
  @TestData("declare const o: any; let [[let]] = o;", "TS1212@28:3|TS2480@28:3")
  @TestData("declare const o: any; let [, let] = o;", "TS1212@29:3|TS2480@29:3")
  @TestData("declare const o: any; let { let } = o;", "TS1212@28:3|TS2480@28:3")
  @TestData("declare const o: any; const { a: let } = o;", "TS1212@33:3|TS2480@33:3")
  @TestMethod
  public refusesLetAsANameItBindsInABlockScopedDeclaration(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare function f([a = 1]): void;", "TS2371@20:1")
  @TestData("declare function f([, a = 1]): void;", "TS2371@22:1")
  @TestData("declare function f({ a = 1 }): void;", "TS2371@21:1")
  @TestData("declare function f({ a: { b = 1 } }): void;", "TS2371@26:1")
  @TestData("function f({ a = 1 }) {}", "")
  @TestMethod
  public refusesAnInitializerInABodilessSignaturePattern(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare function f({ a = { b: 1, b: 2 } }): void;", "TS2371@21:1|TS1117@33:1")
  @TestData("declare function f({ a = { b: 1, b: 2 } }: any): void;", "TS2371@21:1")
  @TestMethod
  public checksASignatureInitializerOnlyWhereItsParameterTypeIsInferred(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare function f({ a: b = 1 }): void;", "")
  @TestData("declare function f({ a: b = { c: 1, c: 2 } }): void;", "")
  @TestData("for (var { c: b } = { c: 1, c: 2 } in {}) {}", "TS1189@9:8|TS2491@9:8|TS1117@28:1")
  @TestData("for (var [b] = [{ c: 1, c: 2 }] in {}) {}", "TS1189@9:3|TS2491@9:3|TS1117@24:1")
  @TestData("for (var [,] = [{ c: 1, c: 2 }] in {}) {}", "TS1189@9:3|TS2491@9:3")
  @TestMethod
  public readsTheDeclaredTypeUnlessItBindsNothingOrRenamesInASignature(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f({ x }: any): x is string { return true; }", "TS1230@24:1")
  @TestData("function f({ a: x }: any): x is string { return true; }", "TS1230@27:1")
  @TestData("function f({ a: { x } }: any): x is string { return true; }", "TS1230@31:1")
  @TestData("function f([, x]: any): x is string { return true; }", "TS1230@24:1")
  @TestData("function f({ y }: any): x is string { return true; }", "TS1225@24:1")
  @TestMethod
  public findsTheNameItBindsForATypePredicate(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("let [...a = []] = [];", "TS1186@10:1")
  @TestData("let { ...a = {} } = {};", "TS1186@11:1")
  @TestData("declare const o: any; let { ...a: b = {} } = o;", "")
  @TestData("let [...a] = [];", "")
  @TestData("let [a = 1] = [];", "")
  @TestMethod
  public refusesAnInitializerOnARestElement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare const o: any; let [...a,] = o;", "TS1013@31:1")
  @TestData("let { ...a, } = {};", "TS1013@10:1")
  @TestData("declare const o: any; let [a,] = o;", "")
  @TestData("let { a, } = { a: 1 };", "")
  @TestMethod
  public refusesATrailingCommaAfterARestElement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
