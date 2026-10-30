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
export class TypeScriptTypeParameterListNodeExtensionsTests {
  @TestData("function f<>() {}", "TS1098@10:2")
  @TestData("class C<> {}", "TS1098@7:2")
  @TestData("const f = function <>() {};", "TS1098@19:2")
  @TestData("interface I<> {}", "")
  @TestData("type T<> = string;", "")
  @TestData("function f<Type>() {}", "")
  @TestMethod
  public reportsAWrittenEmptyTypeParameterList(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parse();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(TypeScriptGrammarFixture.getDiagnostics(parser)));
  }
}
