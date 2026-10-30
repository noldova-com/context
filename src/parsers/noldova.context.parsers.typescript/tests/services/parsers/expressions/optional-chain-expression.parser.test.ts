/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptCallExpressionNode,
  TypeScriptElementAccessExpressionNode,
  TypeScriptParser,
  TypeScriptPropertyAccessExpressionNode,
  TypeScriptTaggedTemplateExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class OptionalChainExpressionParserTests {
  @TestData("a?.b`x`;", 1)
  @TestData("a?.`x`;", 1)
  @TestData("(a?.b)`x`;", 0)
  @TestMethod
  public publishesOneGrammarDiagnosticForAnOptionalTaggedTemplate(content: string, expectedCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expectedCount, result.diagnostics.length);
    if (expectedCount !== 0)
      Assert.areEqual("TS1358", result.diagnostics[0]?.code.displayText);
  }

  @TestData("target?.<Value>;", 0, 1)
  @TestData("target?.<Value>\nargument);", 1, 1)
  @TestData("target?.<Value>)", 0, 1)
  @TestMethod
  public representsMissingCallDelimitersWithoutInventingTokens(content: string, argumentCount: number, diagnosticCount: number): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isDefined(node.typeArgumentListNode);
    Assert.isUndefined(node.argumentListNode.openParenthesisNode);
    Assert.areEqual(argumentCount, node.argumentListNode.children.length);
    Assert.areEqual(diagnosticCount, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1005", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual("'(' expected.", parser.context.diagnosticCollector.diagnostics[0]?.message.text);
  }

  @TestMethod
  public parsesOptionalAccessAndCalls(): void {
    const propertyNode = TypeScriptParserFixture.create("target?.property").parseExpression();
    const elementNode = TypeScriptParserFixture.create("target?.[key]").parseExpression();
    const callNode = TypeScriptParserFixture.create("target?.(value)").parseExpression();
    const typedCallNode = TypeScriptParserFixture.create("target?.<Value>(value)").parseExpression();
    const functionTypedCallNode = TypeScriptParserFixture.create("target?.<<Value>() => Value>(value)").parseExpression();

    Assert.isInstanceOf(propertyNode, TypeScriptPropertyAccessExpressionNode);
    Assert.isInstanceOf(elementNode, TypeScriptElementAccessExpressionNode);
    Assert.isInstanceOf(callNode, TypeScriptCallExpressionNode);
    Assert.isInstanceOf(typedCallNode, TypeScriptCallExpressionNode);
    Assert.isInstanceOf(functionTypedCallNode, TypeScriptCallExpressionNode);
  }

  @TestData("tag?.<Value>`text`", "TS1358@12:6 Tagged template expressions are not permitted in an optional chain.")
  @TestData("tag?.<Value>`text${value}`", "TS1358@12:14 Tagged template expressions are not permitted in an optional chain.")
  @TestMethod
  public reportsTypedTaggedTemplatesInOptionalChains(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptTaggedTemplateExpressionNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(TypeScriptGrammarFixture.getDiagnostics(parser)));
  }

  @TestMethod
  public reportsInvalidTypedPropertyAccess(): void {
    const parser = TypeScriptParserFixture.create("target?.<Value>property");

    parser.parseExpression();

    Assert.areEqual("TS1003", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public refusesAPrivateNameInAnOptionalChain(): void {
    const result = TypeScriptParser.parse("a?.b.#x;");

    Assert.areEqual("TS18030@5:2 An optional chain cannot contain private identifiers.", TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestMethod
  public writesAnArgumentListWithoutParenthesesAtTheEndOfTheTypeArguments(): void {
    const parser = TypeScriptParserFixture.create("a?.<T> ;");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptCallExpressionNode);
    Assert.isUndefined(node.argumentListNode.openParenthesisNode);
    Assert.areEqual(0, node.argumentListNode.children.length);
    Assert.areEqual(6, node.argumentListNode.span.startOffset);
    Assert.areEqual(0, node.argumentListNode.span.length);
    Assert.isUndefined(node.argumentListNode.leadingTrivia);
    Assert.areEqual(6, node.span.endOffset);
    Assert.areEqual("TS1005@7:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }
}
