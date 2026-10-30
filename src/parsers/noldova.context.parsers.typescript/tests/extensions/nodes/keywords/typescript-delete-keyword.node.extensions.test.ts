/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptDeleteExpressionNode, TypeScriptDeleteKeywordNode, TypeScriptPlusNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptDeleteKeywordNodeExtensionsTests {
  @TestMethod
  public startsAnExpression(): void {
    const node = new TypeScriptDeleteKeywordNode(new SourceSpan(0, 0));

    Assert.isTrue(node.canStartTypeScriptExpression(TypeScriptParserFixture.create("")));
  }

  @TestData("delete value;", "TS1102@7:5|TS2703@7:5")
  @TestData("delete value.other;", "")
  @TestData("delete value[key];", "")
  @TestData("delete (value);", "TS2703@8:5")
  @TestData("call(delete );", "TS1109@12:1")
  @TestData("delete ;", "TS1109@7:1")
  @TestMethod
  public readsWhetherWhatIsDeletedIsAWrittenName(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public parsesItsUnaryExpressionBeforeABinaryOperator(): void {
    const prefix = " /*leading*/ ";
    const content = "delete value";
    const parser = TypeScriptParserFixture.create(prefix + content + " + following");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptUnaryExpression(parser);

    Assert.isInstanceOf(node, TypeScriptDeleteExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptPlusNode);
    Assert.areEqual(2, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1102", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }
}
