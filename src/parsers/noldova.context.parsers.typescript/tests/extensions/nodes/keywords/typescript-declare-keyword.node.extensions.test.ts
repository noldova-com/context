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
export class TypeScriptDeclareKeywordNodeExtensionsTests {
  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("declare").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestData("class C { override declare v: number; }", "TS1040@19:7")
  @TestData("class C { override declare m(): void; }", "TS1040@19:7")
  @TestData("class C { constructor(override declare v: number) {} }", "TS1040@31:7")
  @TestData("class C { override async declare m() {} }", "TS1040@25:7|TS1183@37:1")
  @TestData("class C { override declare(): void {} }", "")
  @TestMethod
  public reportsADeclareWrittenAfterWhatOnlyAWrittenBodyCanUse(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
