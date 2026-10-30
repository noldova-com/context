/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptOutKeywordNodeExtensionsTests {
  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("out").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestData("@dec out class C {}", "TS1274@5:3")
  @TestData("@dec override out class C {}", "TS1274@14:3")
  @TestData("class C { out v = 1; }", "TS1274@10:3")
  @TestData("function f(out x: number) {}", "TS1274@11:3")
  @TestData("interface I { out v: number; }", "TS1070@14:3")
  @TestData("type T = { out v: number };", "TS1070@11:3")
  @TestData("class C { out [k: string]: number; }", "TS1071@10:3")
  @TestData("class C<out T> {}", "")
  @TestMethod
  public reportsAVarianceAnnotationWrittenOnWhatDeclaresNoTypeParameter(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C<out out T> {}", "TS1030@12:3")
  @TestData("function f<out T>() {}", "TS1274@11:3")
  @TestData("interface I { m<out T>(): void }", "TS1274@16:3")
  @TestData("class C<out T> {}", "")
  @TestData("interface I<out T> {}", "")
  @TestData("type T<out U> = U;", "")
  @TestData("class C<in out T> {}", "")
  @TestMethod
  public reportsAVarianceAnnotationATypeParameterCannotCarry(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
