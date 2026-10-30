/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptExpressionStatementNode, TypeScriptParser, TypeScriptTaggedTemplateExpressionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTaggedTemplateExpressionNodeExtensionsTests {
  @TestData("module `pkg` {}", 7)
  @TestData("namespace `pkg` {}", 10)
  @TestMethod
  public reportsTemplateSpellingAtTheTemplateRatherThanTheKeyword(content: string, start: number): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptTaggedTemplateExpressionNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1443", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(5, result.diagnostics[0]?.location?.length);
  }
}
