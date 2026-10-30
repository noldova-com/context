/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptImportTypeNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptImportTypeNodeExtensionsTests {
  @TestData("import('module')", "")
  @TestData("import(42)", "TS1141@7:2")
  @TestData("import(number)", "TS1141@7:6")
  @TestData("import()", "TS1141@7:0")
  @TestMethod
  public requiresAStringLiteralArgument(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();
    Assert.isInstanceOf(node, TypeScriptImportTypeNode);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(TypeScriptGrammarFixture.getDiagnostics(parser)));
  }
}
