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
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptClassBodyNodeExtensionsTests {
  @TestData("class C { constructor() {} constructor() {} }", "TS2392@10:11|TS2392@27:11")
  @TestData("class C { constructor(); constructor() {} constructor() {} }", "TS2392@10:11|TS2392@25:11|TS2392@42:11")
  @TestData("class C { \"constructor\"() {} constructor() {} }", "TS2392@10:13|TS2392@29:11")
  @TestData("const C = class { constructor() {} constructor() {} };", "TS2392@18:11|TS2392@35:11")
  @TestData("class C { constructor(); constructor() {} }", "")
  @TestData("class C { constructor() {} }; class D { constructor() {} }", "")
  @TestMethod
  public refusesEveryConstructorOfABodyWithSeveralImplementations(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("class C { constructor() {} constructor() {} }", "TS2392@10:11|TS2392@27:11")
  @TestData("class C { constructor() {} constructor() 5 }", "")
  @TestMethod
  public countsOnlyWrittenBodiesAsImplementations(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parseStatement();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(TypeScriptGrammarFixture.getDiagnostics(parser)));
  }
}
