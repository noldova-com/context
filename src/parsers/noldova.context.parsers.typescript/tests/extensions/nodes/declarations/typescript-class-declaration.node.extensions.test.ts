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
export class TypeScriptClassDeclarationNodeExtensionsTests {
  @TestData("async class C {}", "TS1042@0:5")
  @TestData("readonly class C {}", "TS1024@0:8")
  @TestData("accessor class C {}", "TS1275@0:8")
  @TestData("abstract class C {}", "")
  @TestData("declare class C {}", "")
  @TestMethod
  public refusesTheModifiersAClassCannotTake(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("class {}", "TS1211@0:5")
  @TestData("export class {}", "TS1211@0:6")
  @TestData("abstract class {}", "TS1211@0:8")
  @TestData("declare function dec(target: any): any; @dec class {}", "TS1211@40:1")
  @TestData("export default class {}", "")
  @TestData("class C {}", "")
  @TestMethod
  public requiresANameWithoutTheDefaultModifier(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("class any {}", "TS2414@6:3")
  @TestData("class number {}", "TS2414@6:6")
  @TestMethod
  public refusesAPredefinedTypeAsItsName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare class B {} interface I {} class C implements I extends B {}", "TS1173@55:7")
  @TestData("declare class B {} class C extends B {}", "")
  @TestMethod
  public readsItsHeritageClauses(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("declare function dec(target: any): any; @dec class C {}", "")
  @TestData("declare function dec(target: any): any; @dec export class C {}", "")
  @TestData("declare function dec(target: any): any; export @dec class C {}", "")
  @TestData("@((t: any) => { ({ a: 1, a: 2 }); }) class C {}", "TS1117@25:1")
  @TestMethod
  public acceptsDecoratorsAndChecksTheirExpressions(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("{ export class C {} }", "TS1184@2:6")
  @TestData("{ declare class C {} }", "TS1184@2:7")
  @TestData("{ export abstract class C {} }", "TS1184@2:6")
  @TestData("function f() { export class C {} }", "TS1184@15:6")
  @TestData("{ abstract class C {} }", "")
  @TestData("namespace N { export class C {} }", "")
  @TestData("export class C {}", "")
  @TestMethod
  public refusesModifiersOtherThanAbstractOutsideAModuleStatementList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("l: class C {}", "TS1344@0:1")
  @TestData("declare namespace N { class C {} }", "")
  @TestMethod
  public standsAsADeclarationStatement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("class C {}", "TS1046@0:5")
  @TestData("declare class C {}", "")
  @TestData("export class C {}", "")
  @TestMethod
  public requiresADeclareOrExportModifierInADeclarationFile(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, "source.d.ts", TypeScriptSourceKind.Declaration);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("export {}; class C {}", "TS1046@11:5")
  @TestData("abstract class C {}", "TS1046@0:8")
  @TestData("declare function dec(t: any): any; @dec class C {}", "TS1046@35:1")
  @TestMethod
  public startsAtItsFirstModifierOrDecorator(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content, "source.d.ts", TypeScriptSourceKind.Declaration);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }
}
