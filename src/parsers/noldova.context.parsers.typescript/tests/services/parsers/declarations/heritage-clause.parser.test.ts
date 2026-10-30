/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptClassDeclarationNode,
  TypeScriptClassExpressionNode,
  TypeScriptExpressionWithTypeArgumentsNode,
  TypeScriptIdentifierNode,
  TypeScriptParser,
  TypeScriptReturnStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class HeritageClauseParserTests {
  @TestMethod
  public readsEachGenericHeritageTypeAsOneExpressionWithTypeArguments(): void {
    const parser = TypeScriptParserFixture.create("class C implements I<T>, J<U> {}");
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptClassExpressionNode);
    const clause = node.heritageClauseNodes[0];
    Assert.isDefined(clause);
    Assert.areEqual(2, clause.children.length);
    for (const type of clause.children) {
      Assert.isInstanceOf(type, TypeScriptExpressionWithTypeArgumentsNode);
      Assert.isInstanceOf(type.expressionNode, TypeScriptIdentifierNode);
      Assert.isDefined(type.typeArgumentListNode);
      Assert.areEqual(1, type.typeArgumentListNode.children.length);
    }
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public retainsAnEmptyClauseAndReadsThatItNamesNothing(): void {
    const parser = TypeScriptParserFixture.create("class extends {}");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptClassExpressionNode);
    Assert.areEqual(1, node.heritageClauseNodes.length);
    Assert.areEqual(0, node.heritageClauseNodes[0]?.children.length);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1097", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("class C extends ; A B {}", "TS1109@16:1 Expression expected.|TS1005@20:1 ',' expected.")
  @TestData("class C extends A B {}", "TS1005@18:1 ',' expected.")
  @TestMethod
  public recoversStrayTokensAndMissingCommasWithoutLosingTheClassBody(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.areEqual(2, node.heritageClauseNodes[0]?.children.length);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public endsTheClassAtAStatementKeywordInItsHeritageClause(): void {
    const result = TypeScriptParser.parse("class C extends return {}");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.areEqual(0, node.heritageClauseNodes[0]?.children.length);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptReturnStatementNode);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual("TS1109@16:6 Expression expected.", TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("class C extends A ; {}", "TS1005:;")
  @TestData("class C extends A, ) {}", "TS1109:)")
  @TestData("class C extends B({ ) }) {}", "TS1136:),TS1005:},TS1128:)")
  @TestMethod
  public readsItsTypesAsADelimitedList(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("class C extends A, ) {}", "extends A, )")
  @TestData("class C implements A ) {}", "implements A )")
  @TestMethod
  public endsAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(node.heritageClauseNodes[0]!.span));
  }
}
