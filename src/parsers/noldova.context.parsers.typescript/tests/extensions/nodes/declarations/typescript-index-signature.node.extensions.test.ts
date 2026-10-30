/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptIndexSignatureNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptIndexSignatureNodeExtensionsTests {
  @TestData("class { [...key: string]: T; }", "TS1017@9:3")
  @TestData("class { [key: string = initial]: T; }", "TS1020@9:3")
  @TestData("class { readonly [key: string]: T; }", "")
  @TestData("class { [key: string]; }", "TS1021@8:14")
  @TestData("class { [key: any]; }", "")
  @TestData("class { [key: 1]; }", "")
  @TestData("class { [key: number]; }", "TS1021@8:14")
  @TestData("class { [key: symbol]; }", "TS1021@8:14")
  @TestData("class { [key: Key]; }", "")
  @TestMethod
  public reportsTheFirstProblemOfTheWrittenSignature(content: string, expected: string): void {
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptIndexSignatureNode);
    const validator = new TypeScriptParserContext(new Source(content));

    node.validateTypeScriptGrammar(validator);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(validator.diagnosticCollector.diagnostics));
  }

  @TestData(true, "")
  @TestData(false, "TS1019")
  @TestMethod
  public leavesItsOwnGrammarToTheModifierListsResult(hasModifierDiagnostics: boolean, expectedCodes: string): void {
    const content = "class { [key?: string]: T; }";
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptIndexSignatureNode);
    const validator = new TypeScriptParserContext(new Source(content));

    node.reportTypeScriptGrammarAfterModifiers(validator, hasModifierDiagnostics);

    Assert.areEqual(expectedCodes, validator.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public reportsAMissingTypeOnTheWholeSignature(): void {
    const result = TypeScriptParser.parse("interface I { [key: string]; }");

    Assert.areEqual("TS1021@14:14", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
