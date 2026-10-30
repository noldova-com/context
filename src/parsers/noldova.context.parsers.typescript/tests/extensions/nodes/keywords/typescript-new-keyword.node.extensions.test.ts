/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptNewExpressionNode, TypeScriptNewKeywordNode, TypeScriptParser, TypeScriptSemicolonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptNewKeywordNodeExtensionsTests {
  @TestMethod
  public startsAnExpression(): void {
    const node = new TypeScriptNewKeywordNode(new SourceSpan(0, 0));

    Assert.isTrue(node.canStartTypeScriptExpression(TypeScriptParserFixture.create("")));
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "new Constructor()";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptNewExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesItsPrimaryExpression(): void {
    const parser = TypeScriptParserFixture.create("new new Constructor;");
    const node = parser.currentNode;

    const expressionNode = node.parseTypeScriptPrimaryExpression(parser);

    Assert.isInstanceOf(expressionNode, TypeScriptNewExpressionNode);
    Assert.isInstanceOf(expressionNode.expressionNode, TypeScriptNewExpressionNode);
    Assert.areEqual(0, expressionNode.span.startOffset);
    Assert.areEqual(19, expressionNode.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public startsATypeAndALeftHandSideExpression(): void {
    const parser = TypeScriptParserFixture.create("new");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
    Assert.isTrue(node.canStartTypeScriptLeftHandSideExpression(parser));
  }

  @TestData("function f() { new.foo; }", "TS17012@19:3")
  @TestData("function f() { new.target; }", "")
  @TestMethod
  public namesOnlyTargetAfterNew(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("new.target;")
  @TestData("namespace N { new.target; }")
  @TestData("class C { method() { new.target; } }")
  @TestData("class C { get value() { return new.target; } }")
  @TestData("class C { static { new.target; } }")
  @TestData("class C { value = new.target; }")
  @TestData("class C { method(input = new.target) {} }")
  @TestData("const f = () => new.target;")
  @TestData("const f = (input = new.target) => input;")
  @TestData("const o = { m() { new.target; } };")
  @TestData("function f() { class C { value = new.target; } }")
  @TestMethod
  public reportsANewTargetNothingWrittenAroundItBinds(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS17013", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("new.target"), result.diagnostics[0]?.location?.start);
    Assert.areEqual("new.target".length, result.diagnostics[0]?.location?.length);
    Assert.areEqual("Meta-property 'new.target' is only allowed in the body of a function declaration, function expression, or constructor.",
      result.diagnostics[0]?.message.text);
  }

  @TestData("function f() { new.target; }")
  @TestData("function f(input = new.target) {}")
  @TestData("const f = function () { new.target; };")
  @TestData("class C { constructor() { new.target; } }")
  @TestData("class C { constructor(input = new.target) {} }")
  @TestData("function f() { const g = () => new.target; }")
  @TestData("function f() { const g = () => { new.target; }; }")
  @TestData("function f() { const g = (input = new.target) => input; }")
  @TestData("function f() { class C { [new.target]: Value; } }")
  @TestMethod
  public acceptsANewTargetTheFunctionAroundItBinds(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }
}
