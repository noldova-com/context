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
export class TypeScriptForInOrOfStatementNodeExtensionsTests {
  @TestData("declare namespace N { for (x in y) {} }", "TS1036@22:3")
  @TestData("declare namespace N { for (x of y) {} }", "TS1036@22:3")
  @TestMethod
  public reportsAnAmbientStatementAtItsForKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (const x in y) {}", "")
  @TestData("for (const x of y) {}", "")
  @TestMethod
  public requiresNoInitializerForTheDeclarationItsHeaderBinds(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare namespace N { x; for (using a of b) {} }", "TS1036@22:1|TS1545@30:7")
  @TestData("declare namespace N { x; for (await using a of b) {} }", "TS1036@22:1|TS1546@30:13")
  @TestData("function f() { for (using a of b) {} }", "")
  @TestMethod
  public rejectsAResourceDeclarationHeaderInAnAmbientContext(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (var x = function () { break; } in y) {}", "TS1189@9:1")
  @TestData("for (var [a] = function () { break; } in y) {}", "TS1189@9:3|TS2491@9:3|TS1107@29:6")
  @TestData("for (let x = function () { break; } of y) {}", "TS1190@9:1|TS1107@27:6")
  @TestMethod
  public leavesTheInitializerOfAForInIdentifierDeclarationUnchecked(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (f() in x) {}", "TS2406@5:3")
  @TestData("for (1 of x) {}", "TS2487@5:1")
  @TestData("for ([a] in x) {}", "TS2491@5:3")
  @TestData("for ({ a } in x) {}", "TS2491@5:5")
  @TestData("for (let [a] in x) {}", "TS2491@9:3")
  @TestData("for ([a] of x) {}", "")
  @TestData("for (let { a } of x) {}", "")
  @TestData("for (x.y in z) {}", "")
  @TestData("declare namespace N { for (f() in x) {} }", "TS1036@22:3|TS2406@27:3")
  @TestMethod
  public validatesTheIterationTargetForItsLoopKind(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare namespace N { for (var a = 1 in b) {} }", "TS1036@22:3")
  @TestData("declare namespace N { for (using a of b) {} }", "TS1036@22:3")
  @TestData("declare namespace N { x; for (var a = 1 in b) {} }", "TS1036@22:1|TS1189@34:1")
  @TestData("declare namespace N { x; for (let a: number of b) {} }", "TS1036@22:1|TS2483@34:1")
  @TestMethod
  public leavesTheHeaderOfTheFirstAmbientStatementToTheAmbientStatementCheck(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f() { for await (var x = 1 of y) {} }", "TS1103@19:5")
  @TestData("for await (var x = 1 of y) {}", "TS1431@4:5|TS1190@15:1")
  @TestData("class C { static { for await (var x = 1 of y) {} } }", "TS18038@23:5|TS1190@34:1")
  @TestData("async function f() { for await (var x = 1 of y) {} }", "TS1190@36:1")
  @TestMethod
  public leavesTheHeaderOfAMisplacedForAwaitToTheAwaitCheck(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (async of x) {}", "TS1106@5:5")
  @TestData("function f() { for (async of x) {} }", "TS1106@20:5")
  @TestData("async function f() { for (async of x) {} }", "")
  @TestData("class C { static { for (async of x) {} } }", "")
  @TestData("for (async in x) {}", "")
  @TestMethod
  public rejectsAsyncAsTheTargetOfAForOfOutsideAnAwaitContext(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f() { for (using x in y) {} }", "TS1493@20:7")
  @TestData("async function f() { for (await using x in y) {} }", "TS1494@26:13")
  @TestMethod
  public rejectsAResourceDeclarationAsTheTargetOfAForIn(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (let of x) {}", "TS1123@8:0")
  @TestData("for (var a, in x) {}", "TS1009@10:1")
  @TestData("for (var a = 1, in x) {}", "TS1009@14:1")
  @TestMethod
  public leavesAnEmptyOrTrailingCommaHeaderToTheListCheck(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f() { for (await using x, y of z) {} }", "")
  @TestData("class C { static { for (await using x, y of z) {} } }", "")
  @TestData("async function f() { for (await using x, y of z) {} }", "TS1188@41:1")
  @TestMethod
  public leavesAMisplacedAwaitUsingHeaderToTheAwaitCheck(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (var a, b in x) {}", "TS1091@12:1")
  @TestData("for (var a, { b } in x) {}", "TS1091@12:1")
  @TestData("for (let a, b of x) {}", "TS1188@12:1")
  @TestData("for (let a, [b] of x) {}", "TS1188@12:1")
  @TestData("for (var a in x) {}", "")
  @TestData("for (let a of x) {}", "")
  @TestMethod
  public allowsOneDeclarationInAnIterationHeader(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("for (var x = 1 in y) {}", "TS1189@9:1")
  @TestData("for (let x = 1 in y) {}", "TS1189@9:1")
  @TestData("for (let [a] = [] in x) {}", "TS1189@9:3|TS2491@9:3")
  @TestData("for (var x = 1 of y) {}", "TS1190@9:1")
  @TestData("for (let a: number = 1 of x) {}", "TS1190@9:1")
  @TestData("for (let a: number in x) {}", "TS2404@9:1")
  @TestData("for (let a: number of x) {}", "TS2483@9:1")
  @TestMethod
  public rejectsAnInitializerOrATypeOnAnIterationDeclaration(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
