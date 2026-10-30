/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAccessibilityKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAccessibilityKeywordNodeExtensionsTests {
  @TestData("public")
  @TestData("protected")
  @TestData("private")
  @TestMethod
  public readsAsABindingIdentifierAndAsAModifierInEveryModifierList(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;

    Assert.isInstanceOf(node, TypeScriptAccessibilityKeywordNode);
    Assert.isTrue(node.isTypeScriptBindingIdentifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
    Assert.isTrue(node.isTypeScriptDeclarationModifier());
  }

  @TestData("class C { public public x: number; }", "TS1028@17:6")
  @TestData("public class C {}", "TS1044@0:6")
  @TestData("interface I { protected x: number; }", "TS1070@14:9")
  @TestData("class B {} class C extends B { override public x = 1; }", "TS1029@40:6")
  @TestData("class C { static protected x = 1; }", "TS1029@17:9")
  @TestData("class C { readonly public x = 1; }", "TS1029@19:6")
  @TestData("class C { accessor private x = 1; }", "TS1029@19:7")
  @TestData("class C { async public m() {} }", "TS1029@16:6")
  @TestData("abstract class C { abstract public x: number; }", "TS1029@28:6")
  @TestData("class C { public x = 1; protected y = 2; private z = 3; }", "")
  @TestMethod
  public reportsTheFirstModifierItMustPrecede(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
