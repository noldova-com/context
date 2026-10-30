/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptAccessorNodeExtensionsTests {
  @TestData("interface I { get value(): number {} }", "TS1183@34:2")
  @TestData("type T = { set value(next: number) {} };", "TS1183@35:2")
  @TestData("class C { get value(): number; }", "TS1005@29:1")
  @TestData("class C { set value(next: number); }", "TS1005@33:1")
  @TestData("abstract class C { abstract get value(): number; }", "")
  @TestData("declare class C { get value(): number; }", "")
  @TestData("class C { declare get value(): number; }", "TS1031@10:7")
  @TestMethod
  public requiresABodyExactlyWhereAnImplementationFollows(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { async get value() { return 1; } }", "TS1042@10:5")
  @TestData("class C { readonly set value(next: number) {} }", "TS1024@10:8")
  @TestData("class C { abstract get value(): number; }", "TS1244@10:8")
  @TestData("class C { static get value() { return 1; } }", "")
  @TestMethod
  public acceptsTheModifiersAnAccessorMayWrite(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { @d get value() { return 1; } }", "")
  @TestData("class C { @d get value(): number; }", "TS1206@10:1")
  @TestMethod
  public carriesADecoratorOnlyWithABody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { get a(this: any) { return 1; } }", "TS2784@16:9")
  @TestData("interface I { get a(this: any): number; }", "TS2784@20:9")
  @TestData("class C { set a(this: any, v) {} }", "TS2784@16:9")
  @TestMethod
  public refusesAThisParameterWithOrWithoutABody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { set a([b]?) {} }", "TS2463@16:4|TS1051@19:1")
  @TestData("interface I { set a(v = 1); }", "TS1052@18:1|TS2371@20:5")
  @TestMethod
  public readsItsParametersByItsBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
