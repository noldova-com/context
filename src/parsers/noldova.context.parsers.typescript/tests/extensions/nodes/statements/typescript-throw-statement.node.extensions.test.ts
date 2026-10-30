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
export class TypeScriptThrowStatementNodeExtensionsTests {
  @TestData("throw value;", "", 12)
  @TestData("throw\nvalue;", "TS1142@5:0", 6)
  @TestMethod
  public reportsAMissingLineSeparatedOperandWithoutConsumingTheNextStatement(content: string, expected: string, nextOffset: number): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parseStatement();

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(TypeScriptGrammarFixture.getDiagnostics(parser)));
    Assert.areEqual(nextOffset, parser.currentNode.span.startOffset);
  }

  @TestData("throw;", "TS1109@5:1")
  @TestData("throw )", "TS1109@6:1")
  @TestMethod
  public recordsEveryMissingOperandButPublishesOnlyTheParseDiagnostic(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);

    parser.parseStatement();

    Assert.areEqual("TS1142@5:0", TypeScriptDiagnosticsFixture.project(TypeScriptGrammarFixture.getDiagnostics(parser)));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
