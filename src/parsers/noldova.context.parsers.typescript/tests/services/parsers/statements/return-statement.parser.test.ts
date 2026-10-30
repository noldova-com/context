/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptReturnStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ReturnStatementParserTests {
  @TestMethod
  public parsesReturnValuesAndLineBreakTermination(): void {
    const valueParser = TypeScriptParserFixture.create("return value;");
    const lineBreakParser = TypeScriptParserFixture.create("return\nvalue;");
    const valueNode = valueParser.parseStatement();
    const lineBreakNode = lineBreakParser.parseStatement();

    Assert.isInstanceOf(valueNode, TypeScriptReturnStatementNode);
    Assert.isDefined(valueNode.expressionNode);
    Assert.isDefined(valueNode.semicolonNode);
    Assert.isInstanceOf(lineBreakNode, TypeScriptReturnStatementNode);
    Assert.isUndefined(lineBreakNode.expressionNode);
  }

  @TestData("function f() { return; }", "")
  @TestData("class C { m() { return; } }", "")
  @TestData("class C { static { return; } }", "TS18041@19:6")
  @TestData("class C { static { { return; } } }", "TS18041@21:6")
  @TestData("class C { static { function f() { return; } } }", "")
  @TestData("class C { static { const f = () => { return; }; } }", "")
  @TestData("namespace N { return; }", "TS1108@14:6")
  @TestData("{ return; }", "TS1108@2:6")
  @TestData("return;", "TS1108@0:6")
  @TestMethod
  public readsWhichConstructAReturnStatementLeaves(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
