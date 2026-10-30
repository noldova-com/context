/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptArrowFunctionNode,
  TypeScriptAwaitExpressionNode,
  TypeScriptClassDeclarationNode,
  TypeScriptDefaultKeywordNode,
  TypeScriptEqualsNode,
  TypeScriptExportAssignmentNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ExportAssignmentParserTests {
  @TestData("export default value;", true)
  @TestData("export = value;", false)
  @TestMethod
  public retainsTheWrittenAssignmentForm(content: string, isDefault: boolean): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportAssignmentNode);
    Assert.areEqual(isDefault, node.assignmentTokenNode instanceof TypeScriptDefaultKeywordNode);
    Assert.areEqual(!isDefault, node.assignmentTokenNode instanceof TypeScriptEqualsNode);
    Assert.isDefined(node.semicolonNode);
    Assert.areEqual(content.length, node.span.endOffset);
    Assert.areEqual(isDefault ? "" : "TS1203", result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public parsesAsyncArrowValuesWithoutTreatingThemAsFunctionDeclarations(): void {
    const result = TypeScriptParser.parse("export default async (x) => x;");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportAssignmentNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptArrowFunctionNode);
    Assert.areEqual(1, node.expressionNode.modifierNodes.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("export default async\nfunction f(){}", TypeScriptFunctionDeclarationNode)
  @TestData("export default abstract\nclass C {}", TypeScriptClassDeclarationNode)
  @TestMethod
  public leavesTheFollowingDeclarationOutsideTheExportedValue(content: string, expectedType: Function & NodeType): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExportAssignmentNode);
    Assert.isInstanceOf(result.rootNode.children[1], expectedType);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("export default", 14, 0)
  @TestData("export = ;", 9, 1)
  @TestData("export default ;", 15, 1)
  @TestMethod
  public preservesTheBoundaryOfAMissingValue(content: string, start: number, length: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptExportAssignmentNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(0, node.expressionNode.span.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1109", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public scopesAwaitForTheExportedExpressionAndRestoresTheCaller(): void {
    const parser = TypeScriptParserFixture.create("export default await value;", TypeScriptContextFlags.Yield);
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptExportAssignmentNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptAwaitExpressionNode);
    Assert.areEqual(TypeScriptContextFlags.Yield, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("export default x.await; f(a if (b) c);", "TS1005@28:2|TS1434@35:1|TS1128@36:1")
  @TestData("export default await;\nf(a if (b) c);", "TS1109@20:1|TS1005@26:2|TS1434@33:1|TS1128@34:1")
  @TestData("export = await;", "TS1109@14:1")
  @TestMethod
  public forgetsTheAwaitNamesAnExportAssignmentReads(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
