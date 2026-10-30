/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser, TypeScriptSourceKind } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptFunctionDeclarationNodeExtensionsTests {
  @TestData("abstract function f() {}", "TS1242@0:8")
  @TestData("readonly function f() {}", "TS1024@0:8")
  @TestData("accessor function f() {}", "TS1275@0:8")
  @TestData("async function f() {}", "")
  @TestData("declare function f(): void;", "")
  @TestMethod
  public refusesTheModifiersAFunctionCannotTake(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("{ export function f() {} }", "TS1184@2:6")
  @TestData("{ declare function f(): void; }", "TS1184@2:7")
  @TestData("{ export async function f() {} }", "TS1184@2:6")
  @TestData("{ async function f() {} }", "")
  @TestData("namespace N { export function f() {} }", "")
  @TestData("export function f() {}", "")
  @TestMethod
  public refusesModifiersOtherThanAsyncOutsideAModuleStatementList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("l: function f() {}", "TS1344@0:1")
  @TestData("declare namespace N { function f(): void; }", "")
  @TestMethod
  public standsAsADeclarationStatement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("function f(): void;", "TS1046@0:8")
  @TestData("declare function f(): void;", "")
  @TestData("export function f(): void;", "")
  @TestMethod
  public requiresADeclareOrExportModifierInADeclarationFile(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, "source.d.ts", TypeScriptSourceKind.Declaration);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("export {}; function f(): void;", "TS1046@11:8")
  @TestData("async function f(): Promise<void>;", "TS1040@0:5|TS1046@0:5")
  @TestMethod
  public startsAtItsFirstModifier(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, "source.d.ts", TypeScriptSourceKind.Declaration);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
