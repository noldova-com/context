/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptAsExpressionNode, TypeScriptAsKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAsKeywordNodeExtensionsTests {
  @TestMethod
  public createsItsOwnExpressionHoldingItself(): void {
    const parser = TypeScriptParserFixture.create("left as Value");

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptAsExpressionNode);
    Assert.isInstanceOf(node.asKeywordNode, TypeScriptAsKeywordNode);
    Assert.areEqual(5, node.asKeywordNode.span.startOffset);
  }

  @TestData("export as namespace N;", "TS1314@0:22")
  @TestData("class C { export as() {} }", "TS1434@10:6")
  @TestMethod
  public startsANamespaceExportAndFollowsNoExportModifier(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
