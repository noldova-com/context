/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptConstructorDeclarationNodeExtensionsTests {
  @TestData("class { constructor<Type>() {} }", "TS1092", "Type")
  @TestData("class { constructor<First, Second>() {} }", "TS1092", "First, Second")
  @TestData("class { constructor<Type>(): Result {} }", "TS1092", "Type")
  @TestData("class { constructor(): Result {} }", "TS1093", "Result")
  @TestMethod
  public reportsTheWrittenTypeParametersOrReturnAnnotation(content: string, expectedCode: string, expectedText: string): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parseExpression();

    const diagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);
    Assert.areEqual(1, diagnostics.length);
    Assert.areEqual(expectedCode, diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), diagnostics[0]?.location?.start);
    Assert.areEqual(expectedText.length, diagnostics[0]?.location?.length);
  }

  @TestMethod
  public acceptsAnOrdinaryConstructor(): void {
    const parser = TypeScriptParserFixture.create("class { constructor(value: Type) {} }");

    parser.parseExpression();

    Assert.areEqual(0, TypeScriptGrammarFixture.getDiagnostics(parser).length);
  }

  @TestData("class C { constructor(this: any) {} }", "TS2681@22:9")
  @TestData("declare class C { constructor(this: any); }", "TS2681@30:9")
  @TestMethod
  public refusesAThisParameterWithOrWithoutABody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { constructor([a]?) {} }", "TS2463@22:4")
  @TestData("declare class C { constructor(a = 1); }", "TS2371@30:5")
  @TestMethod
  public readsItsParametersByItsBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
