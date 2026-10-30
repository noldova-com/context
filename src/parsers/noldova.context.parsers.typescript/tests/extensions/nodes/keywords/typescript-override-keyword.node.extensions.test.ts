/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptOverrideKeywordNodeExtensionsTests {
  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("override").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestMethod
  public reportsAnOverrideConstructorDeclaration(): void {
    const content = "class C { override constructor() {} }";
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1089", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("override"), result.diagnostics[0]?.location?.start);
    Assert.areEqual("'override' modifier cannot appear on a constructor declaration.", result.diagnostics[0]?.message.text);
  }

  @TestData("class C { declare override v: number; }", "TS1243@18:8")
  @TestData("class C { declare override accessor v: number; }", "TS1243@18:8")
  @TestData("class C { declare readonly override v: number; }", "TS1243@27:8")
  @TestData("class C { override v: number; }", "")
  @TestData("declare class C { override v: number; }", "")
  @TestData("class C { declare override = 1; }", "TS1039@29:1")
  @TestMethod
  public reportsAnOverrideWrittenAfterADeclare(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
