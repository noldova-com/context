/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptArrowFunctionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptArrowFunctionNodeExtensionsTests {
  @TestData("(value) => value", 16)
  @TestData("(value) => { return value; }", 28)
  @TestData("(value) => {" + String.fromCharCode(10) + "  return value;" + String.fromCharCode(10) + "}", 12)
  @TestData("(value) { return value; }", 25)
  @TestMethod
  public namesItselfByTheArrowWrittenUpToTheLineItsBodyOpensOn(content: string, expectedLength: number): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptArrowFunctionNode);
    Assert.areEqual(0, node.getTypeScriptDeclarationNameSpan(parser.context).startOffset);
    Assert.areEqual(expectedLength, node.getTypeScriptDeclarationNameSpan(parser.context).length);
  }

  @TestData("var f = (this: any) => 1;", "TS2730@9:9")
  @TestData("var f = async (this: any) => 1;", "TS2730@15:9")
  @TestData("var f = (a, this: any) => 1;", "TS2680@12:9|TS2730@12:9")
  @TestMethod
  public refusesAThisParameter(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var f = ([a]?) => 1;", "TS2463@9:4")
  @TestData("var f = (a = 1) => a;", "")
  @TestMethod
  public readsItsParametersAsAnImplementation(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
