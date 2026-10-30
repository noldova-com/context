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
export class TypeScriptStaticKeywordNodeExtensionsTests {
  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("static").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestData("class C { static constructor() {} }")
  @TestData("class C { public static constructor() {} }")
  @TestMethod
  public reportsAStaticConstructorDeclaration(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1089", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("static"), result.diagnostics[0]?.location?.start);
    Assert.areEqual("'static' modifier cannot appear on a constructor declaration.", result.diagnostics[0]?.message.text);
  }

  @TestData("class C { static method() {} }")
  @TestData("class C { static [key: string]: Value; }")
  @TestData("class C { static readonly [key: string]: Value; }")
  @TestMethod
  public acceptsAStaticClassMember(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestData("static {", true)
  @TestData("static\n{", true)
  @TestData("static x", false)
  @TestData("static;", false)
  @TestMethod
  public startsAClassStaticBlockBeforeAnOpeningBrace(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.currentNode;

    Assert.areEqual(expected, node.startsTypeScriptClassStaticBlock(parser));
    Assert.areEqual(node, parser.currentNode);
  }

  @TestData("interface I { static\nx: 1 }", "TS1070@14:6")
  @TestData("class C { static\nx; }", "")
  @TestData("var o = { static\nm() {} };", "TS1042@10:6|TS1184@10:6")
  @TestMethod
  public readsAsAModifierAcrossALineBreak(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
