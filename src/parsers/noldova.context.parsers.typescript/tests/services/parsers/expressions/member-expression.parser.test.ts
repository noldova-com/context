/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptCallExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptMetaPropertyNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParser,
  TypeScriptPropertyAccessExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class MemberExpressionParserTests {
  @TestMethod
  public parsesImportFormsAndMemberChains(): void {
    const importMetaNode = TypeScriptParserFixture.create("import.meta").parseExpression();
    const dynamicImportNode = TypeScriptParserFixture.create("import(value)").parseExpression();
    const memberNode = TypeScriptParserFixture.create("target.member").parseExpression();

    Assert.isInstanceOf(importMetaNode, TypeScriptMetaPropertyNode);
    Assert.isInstanceOf(dynamicImportNode, TypeScriptCallExpressionNode);
    Assert.isInstanceOf(memberNode, TypeScriptPropertyAccessExpressionNode);
  }

  @TestMethod
  public reportsMissingImportMetaName(): void {
    const parser = TypeScriptParserFixture.create("import.");

    parser.parseExpression();

    Assert.areEqual("TS1003", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public reportsInvalidAndIncompleteImportExpressions(): void {
    const invalidMetaParser = TypeScriptParserFixture.create("import.value");
    const incompleteParser = TypeScriptParserFixture.create("import");

    invalidMetaParser.parseExpression();
    const metaNodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(invalidMetaParser);
    incompleteParser.parseExpression();

    Assert.areEqual("TS17012", metaNodeGrammarDiagnostics[0]?.code.displayText);
    Assert.areEqual("TS1109", incompleteParser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("super;", "TS1034@5:1 'super' must be followed by an argument list or member access.")
  @TestData("super<T>();", "TS2754@5:3 'super' may not use type arguments.")
  @TestData("super<T>`x`;", "TS2754@5:3 'super' may not use type arguments.|TS1034@8:3 'super' must be followed by an argument list or member access.")
  @TestData("super = a;", "TS1034@6:1 'super' must be followed by an argument list or member access.")
  @TestData("super<T>.x;", "TS2754@5:3 'super' may not use type arguments.")
  @TestData("super<T>.;",
    "TS1477@5:3 An instantiation expression cannot be followed by a property access.|TS2754@5:3 'super' may not use type arguments.|TS1003@9:1 Identifier expected.")
  @TestData("super<T>?.x;", "TS2754@5:3 'super' may not use type arguments.|TS1034@8:2 'super' must be followed by an argument list or member access.")
  @TestData("super<T> x;", "TS1034@5:1 'super' must be followed by an argument list or member access.")
  @TestMethod
  public reportsASuperWithTypeArgumentsOrWithoutACallOrMemberAccess(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("x = import. ;", "TS1003@12:1")
  @TestData("x = import.", "TS1003@11:0")
  @TestMethod
  public writesAMissingMetaPropertyNameAtTheEndOfTheDot(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    const node = statement.expressionNode.rightNode;
    Assert.isInstanceOf(node, TypeScriptMetaPropertyNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(11, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual(11, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
