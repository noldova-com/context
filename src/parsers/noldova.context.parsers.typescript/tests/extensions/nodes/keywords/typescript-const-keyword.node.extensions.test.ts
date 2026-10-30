/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptConstKeywordNode, TypeScriptIdentifierNode, TypeScriptParser, TypeScriptVariableStatementNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptConstKeywordNodeExtensionsTests {
  @TestMethod
  public readsAsAModifierOfDeclarationsParametersTypeMembersAndTypeParameters(): void {
    const node = new TypeScriptConstKeywordNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestMethod
  public isAVariableDeclarationKeyword(): void {
    const node = new TypeScriptConstKeywordNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptVariableDeclarationKeyword());
  }

  @TestMethod
  public parsesItsStatementAndLeavesTheFollowingToken(): void {
    const content = "const a = 1;";
    const prefix = " /*leading*/ ";
    const parser = TypeScriptParserFixture.create(prefix + content + " next;");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.currentNode.parseTypeScriptStatement(parser);
    const followingNode = parser.currentNode;

    Assert.isInstanceOf(node, TypeScriptVariableStatementNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(followingNode, TypeScriptIdentifierNode);
    Assert.areEqual("next", followingNode.value);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("class C { const value: Value; }", "value")
  @TestData("class C { const method() {} }", "method")
  @TestData("class C { const get value() { return 1; } }", "value")
  @TestData("class C { const set value(input) {} }", "value")
  @TestData("class C { static const value = 1; }", "value")
  @TestData("class C { const accessor value = 1; }", "value")
  @TestData("class C { const constructor() {} }", "const constructor")
  @TestMethod
  public reportsAClassMemberWrittenConst(content: string, expectedText: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1248", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.lastIndexOf(expectedText), result.diagnostics[0]?.location?.start);
    Assert.areEqual(expectedText.length, result.diagnostics[0]?.location?.length);
    Assert.areEqual("A class member cannot have the 'const' keyword.", result.diagnostics[0]?.message.text);
  }

  @TestData("const enum E { A }", "")
  @TestData("class C { const [key: string]: Value; }", "TS1071")
  @TestMethod
  public leavesAnEnumAndAnIndexSignatureToTheirOwnRules(content: string, expectedCode: string): void {
    Assert.areEqual(expectedCode, TypeScriptParser.parse(content).diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("interface I { const enum: 1 }", "TS1070@14:5")
  @TestData("function f(const enum) {}", "TS1359@17:4|TS1003@21:1")
  @TestData("var o = { const enum: 1 };", "TS1042@10:5")
  @TestData("class C { const x = 1; }", "TS1248@16:1")
  @TestMethod
  public readsAsAModifierBeforeEnumOutsideClassesAndTypeParameters(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
