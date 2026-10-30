/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptFunctionNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptFunctionNodeExtensionsTests {
  @TestData("function f(){}", false)
  @TestData("export function f(){}", true)
  @TestMethod
  public identifiesItsExternalModuleRole(content: string, expected: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptFunctionNode);
    Assert.areEqual(expected, node.isTypeScriptExternalModuleIndicator());
  }

  @TestData("function f([a]?) {}", "TS2463@11:4")
  @TestData("declare function f(a = 1);", "TS2371@19:5")
  @TestData("var g = function ([a]?) {};", "TS2463@18:4")
  @TestData("function f(a, this: any) {}", "TS2680@14:9")
  @TestMethod
  public readsItsParametersByItsBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
