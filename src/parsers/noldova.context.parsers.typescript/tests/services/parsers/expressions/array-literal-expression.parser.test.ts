/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptArrayLiteralExpressionNode, TypeScriptOmittedExpressionNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ArrayLiteralExpressionParserTests {
  @TestMethod
  public parsesEmptyOrdinaryOmittedAndSpreadElements(): void {
    const emptyNode = TypeScriptParserFixture.create("[]").parseExpression();
    const populatedNode = TypeScriptParserFixture.create("[first,,...rest,]").parseExpression();

    Assert.isInstanceOf(emptyNode, TypeScriptArrayLiteralExpressionNode);
    Assert.areEqual(0, emptyNode.children.length);
    Assert.isInstanceOf(populatedNode, TypeScriptArrayLiteralExpressionNode);
    Assert.areEqual(3, populatedNode.children.length);
    Assert.areEqual(3, populatedNode.commaNodes.length);
  }

  @TestMethod
  public placesAnElidedElementWhereTheCommaThatEndsItStarts(): void {
    const node = TypeScriptParserFixture.create("[a, , b]").parseExpression();

    Assert.isInstanceOf(node, TypeScriptArrayLiteralExpressionNode);
    const elidedNode = node.children[1];
    Assert.isInstanceOf(elidedNode, TypeScriptOmittedExpressionNode);
    Assert.areEqual(4, elidedNode.span.startOffset);
    Assert.areEqual(0, elidedNode.span.length);
    Assert.areEqual(node.commaNodes[1]?.leadingTrivia, elidedNode.leadingTrivia);
    Assert.isUndefined(elidedNode.trailingTrivia);
  }

  @TestMethod
  public reportsAMissingClosingBracket(): void {
    const parser = TypeScriptParserFixture.create("[value");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptArrayLiteralExpressionNode);
    Assert.isUndefined(node.closeBracketNode);
    Assert.areEqual("TS1005@6:0 ']' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("const a=[x y];", "TS1005@11:1 ',' expected.", 1)
  @TestData("const a=[x; y];", "TS1005@10:1 ',' expected.|TS1434@12:1 Unexpected keyword or identifier.|TS1128@13:1 Declaration or statement expected.", 3)
  @TestData("const a=[x, : ,y];", "TS1137@12:1 Expression or comma expected.", 1)
  @TestData("const a=[.x];", "TS1109@9:1 Expression expected.", 1)
  @TestMethod
  public reportsMalformedElementsAndKeepsStatementBoundaries(content: string, expectedDiagnostics: string, expectedStatements: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.length);
  }

  @TestData("let a = [<{ , }>x];", "TS1131:,,TS1137:},TS1109:>,TS1005:]")
  @TestData("let a = [<{ . }>x];", "TS1131:.,TS1003:},TS1109:>,TS1005:]")
  @TestMethod
  public endsAListItHoldsAtAnElementsStart(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = [a in b];;) {}", "TS1005@54:2|TS1005@58:1|TS1128@61:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = [...a in b];;) {}", "TS1005@57:2|TS1005@61:1|TS1128@64:1")
  @TestData("declare const x: any, a: any, b: any; for (var k = [in];;) {}", "TS1137@52:2|TS1109@54:1|TS1128@57:1")
  @TestMethod
  public holdsTheInRestrictionThroughElements(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("x = [1, 2;", "TS1005@9:1|TS1005@10:0{The parser expected to find a ']' to match the '[' token here.@4}")
  @TestData("x = [1 2;", "TS1005@7:1|TS1005@8:1|TS1005@9:0{The parser expected to find a ']' to match the '[' token here.@4}")
  @TestMethod
  public namesTheOpenBracketAMissingCloseWouldMatch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(result.diagnostics));
  }

  @TestData("[a )", "[a )")
  @TestData("[a, )", "[a, )")
  @TestMethod
  public endsAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptArrayLiteralExpressionNode);
    Assert.areEqual(expected, parser.context.source.getText(node.span));
  }
}
