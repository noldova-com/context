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
export class TypeScriptAbstractKeywordNodeExtensionsTests {
  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("abstract").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestData("class C { abstract method(): void; }", "TS1244")
  @TestData("class C { abstract get value(): Value; }", "TS1244")
  @TestData("class C { abstract set value(input: Value); }", "TS1244")
  @TestData("class C { abstract value: Value; }", "TS1253")
  @TestData("class C { abstract accessor value: Value; }", "TS1253")
  @TestData("declare class C { abstract method(): void; }", "TS1244")
  @TestData("const C = class { abstract method(): void; };", "TS1244")
  @TestMethod
  public reportsAnAbstractMemberNoAbstractClassHolds(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(expectedCode, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("abstract"), result.diagnostics[0]?.location?.start);
    Assert.areEqual("abstract".length, result.diagnostics[0]?.location?.length);
  }

  @TestData("abstract class C { abstract method(): void; }")
  @TestData("abstract class C { abstract value: Value; }")
  @TestData("abstract class C { method(): void {} }")
  @TestData("abstract class C { method() { class Inner {} } abstract value: Value; }")
  @TestMethod
  public acceptsAnAbstractMemberAnAbstractClassHolds(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }

  @TestData("export default abstract class {}", "")
  @TestData("export default abstract\nclass C {}", "")
  @TestMethod
  public followsADefaultBeforeAClassOnItsLine(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
