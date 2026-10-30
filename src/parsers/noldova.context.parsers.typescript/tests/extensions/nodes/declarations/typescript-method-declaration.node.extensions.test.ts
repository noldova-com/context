/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptMethodDeclarationNode } from "@noldova/context.parsers.typescript";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptMethodDeclarationNodeExtensionsTests {
  @TestData("class { run() {} }", 8, 3)
  @TestData("class { *run() {} }", 9, 3)
  @TestData("class { *() {} }", 9, 0)
  @TestData("class { static *() {} }", 16, 0)
  @TestMethod
  public namesItsWrittenOrMissingName(content: string, expectedStart: number, expectedLength: number): void {
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptMethodDeclarationNode);

    const span = node.getTypeScriptDeclarationNameSpan(new TypeScriptParserContext(new Source(content)));

    Assert.areEqual(expectedStart, span.startOffset);
    Assert.areEqual(expectedLength, span.length);
  }

  @TestData("var o = { m() };", "TS1005@12:1")
  @TestData("var o = { m() {} };", "")
  @TestMethod
  public requiresABodyInAnObjectLiteral(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { m([a]?) {} }", "TS2463@12:4")
  @TestData("declare class C { m([a]?); }", "")
  @TestData("declare class C { m(a = 1); }", "TS2371@20:5")
  @TestData("class C { m(a = 1) {} }", "")
  @TestData("var o = { m(this: any) {} };", "")
  @TestMethod
  public readsItsParametersByItsBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
