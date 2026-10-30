/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptParser, TypeScriptPrivateIdentifierNode, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptPrivateIdentifierNodeExtensionsTests {
  @TestMethod
  public readsAsAPropertyNameAndAnAccessName(): void {
    const node = new TypeScriptPrivateIdentifierNode("value", new SourceSpan(0, 5));

    Assert.isTrue(node.canStartTypeScriptPropertyName());
    Assert.isTrue(node.isTypeScriptAccessName());
  }

  @TestMethod
  public startsAPrimaryExpressionThatIsALeftHandSideExpression(): void {
    const node = new TypeScriptPrivateIdentifierNode("value", new SourceSpan(0, 5));

    Assert.isTrue(node.canStartTypeScriptPrimaryExpression(TypeScriptParserFixture.create("#value")));
    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
  }

  @TestMethod
  public startsAVariableDeclaration(): void {
    Assert.isTrue(new TypeScriptPrivateIdentifierNode("value", new SourceSpan(0, 5)).canStartTypeScriptVariableDeclaration());
  }

  @TestMethod
  public canFollowAnUnscopedAwaitOrYield(): void {
    Assert.isTrue(new TypeScriptPrivateIdentifierNode("value", new SourceSpan(0, 5)).canFollowTypeScriptUnscopedAwaitOrYield());
  }

  @TestMethod
  public readsItsValueAsItsTokenValue(): void {
    Assert.areEqual("value", new TypeScriptPrivateIdentifierNode("value", new SourceSpan(0, 5)).getTypeScriptTokenValue());
  }

  @TestData("await #x;", "TS1375@0:5|TS18016@6:2")
  @TestData("function f() { await #x; }", "TS1308@15:5|TS18016@21:2")
  @TestData("class C { #x = 1; m(v: any) { await #x; } }", "TS1308@30:5")
  @TestData("class C { #x = 1; m(v: any) { return await #x in v; } }", "TS1308@37:5")
  @TestData("class C { #x = 1; m() { await #x.y; } }", "TS1308@24:5")
  @TestData("class C { #x = 1; static { await #x; } }", "TS18037@27:8")
  @TestData("class C { #x = 1; m(v: any) { yield #x in v; } }", "TS1163@30:5")
  @TestData("class C { #x = 1; m() { yield #x; } }", "TS1163@24:5")
  @TestData("await\n#x;", "TS18016@6:2")
  @TestData("class C { #x = 1; m() { yield\n#x; } }", "TS1213@24:5")
  @TestMethod
  public readsAPrivateNameAsTheOperandOfAnAwaitOrYield(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public refusesTheReservedConstructorName(): void {
    const result = TypeScriptParser.parse("class A { #constructor() {} m() { this.#constructor; #constructor in this; } }");

    Assert.areEqual("TS18012@10:12|TS18012@39:12|TS18012@53:12", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public parsesItsPrimaryExpressionAndPreservesTheFollowingToken(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ #field /*trailing*/ ;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.areEqual(node, expressionNode);
    Assert.areEqual(node.leadingTrivia, expressionNode.leadingTrivia);
    Assert.areEqual(node.span.startOffset, expressionNode.span.startOffset);
    Assert.areEqual(19, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual("TS18016@13:6", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("static #x;", "TS1128@0:6")
  @TestData("readonly #x;", "TS1128@0:8")
  @TestData("accessor #x;", "TS1128@0:8")
  @TestData("function f() { static #x; }", "TS1128@15:6")
  @TestData("export { #x };", "")
  @TestData("import { #x } from 'm';", "")
  @TestData("let v: #b;", "")
  @TestData("class C { static #x; }", "")
  @TestMethod
  public readsAPrivateNameWhereAWrittenNameIsRead(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var o = { #a: 1 };", "TS18016@10:2")
  @TestData("var o = { #m() {} };", "TS18016@10:2")
  @TestData("var o = { get #a() { return 1; } };", "TS18016@14:2")
  @TestMethod
  public namesNoObjectLiteralMember(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
