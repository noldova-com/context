/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptFunctionTypeNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptParameterListNodeExtensionsTests {
  @TestData("(first, optional?) => T", "")
  @TestData("(optional?, required) => T", "TS1016@12:8")
  @TestData("(defaulted = fallback, required) => T", "TS2371@1:20")
  @TestData("(optional?, defaulted = fallback) => T", "TS2371@12:20")
  @TestData("(...rest,) => T", "TS1013@8:1")
  @TestMethod
  public validatesOrderingOfThePreservedParameters(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();
    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(TypeScriptGrammarFixture.getDiagnostics(parser)));
  }
}
