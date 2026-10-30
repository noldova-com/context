/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCallExpressionNode, TypeScriptExpressionStatementNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import "@noldova/context.parsers.typescript/extensions/nodes/typescript-delimited-list.node.extensions.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class TypeScriptDelimitedListNodeExtensionsTests {
  @TestData("call(a, b,);", 9)
  @TestData("call(a,);", 6)
  @TestData("call(a, b);", undefined)
  @TestData("call();", undefined)
  @TestMethod
  public namesTheCommaThatFollowsTheLastElement(content: string, expectedStart: number | undefined): void {
    const statement = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptCallExpressionNode);

    Assert.areEqual(expectedStart, statement.expressionNode.argumentListNode.getTypeScriptTrailingComma()?.span.startOffset);
  }

  @TestData("var [...a,] = b;", "TS1013@9:1")
  @TestData("var {...a,} = b;", "TS1013@9:1")
  @TestData("[...a,] = b;", "TS1013@5:1")
  @TestData("({...a,} = b);", "TS1013@6:1")
  @TestData("function f(...a,) {}", "TS1013@15:1")
  @TestData("var [a, ...b] = c;", "")
  @TestData("[a, ...b] = c;", "")
  @TestData("var [a, , ] = c;", "")
  @TestMethod
  public reportsARestElementBeforeATrailingComma(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
