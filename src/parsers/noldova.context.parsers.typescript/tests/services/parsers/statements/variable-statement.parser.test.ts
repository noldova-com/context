/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAwaitKeywordNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptParser,
  TypeScriptUsingKeywordNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class VariableStatementParserTests {
  @TestData("using value = resource;", false, 0, "")
  @TestData("await using value = resource;", true, 0, "")
  @TestData("declare using value;", false, 1, "TS1491")
  @TestData("export using value = resource;", false, 1, "TS1491")
  @TestData("export await using value = resource;", true, 1, "TS1495")
  @TestData("declare await using value;", true, 1, "TS1495")
  @TestMethod
  public preservesTheResourceKeywordsAndWrittenDeclarationModifiers(
    content: string,
    isAwaited: boolean,
    modifierCount: number,
    expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.isInstanceOf(statement.declarationListNode.keywordNode, TypeScriptUsingKeywordNode);
    Assert.areEqual(isAwaited, !Object.isUndefined(statement.declarationListNode.awaitKeywordNode));
    if (isAwaited)
      Assert.isInstanceOf(statement.declarationListNode.awaitKeywordNode, TypeScriptAwaitKeywordNode);
    Assert.areEqual(1, statement.declarationListNode.children.length);
    Assert.areEqual(modifierCount, statement.modifierNodes.length);
    Assert.isDefined(statement.semicolonNode);
    Assert.areEqual(content.length, statement.span.length);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("using value;", "TS1155")
  @TestData("using value: Resource = resource;", "")
  @TestData("using value! = resource;", "TS1263")
  @TestData("using { value } = resource;", "TS1492")
  @TestData("await using value;", "TS1155")
  @TestMethod
  public retainsSyntaxWhoseResourceLegalityRequiresLaterValidation(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptVariableStatementNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("using\nvalue = resource;", 2, "")
  @TestData("using /*\n*/ value = resource;", 2, "")
  @TestData("using [value] = resource;", 1, "")
  @TestData("await using\nvalue = resource;", 2, "TS1375")
  @TestData("await using(resource);", 1, "TS1375")
  @TestMethod
  public leavesIdentifierAndExpressionFormsToTheirOwners(content: string, statementCount: number, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public preservesEmbeddedSpansTriviaAndTentativeParsing(): void {
    const content = " /*lead*/ await using first = resource; /*tail*/ ";
    const reader = new SourceReader(new Source("<html>" + content + "</html>"), new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    Assert.areEqual(6 + content.indexOf("await"), statement.span.startOffset);
    Assert.areEqual(statement.span.startOffset, statement.declarationListNode.span.startOffset);
    Assert.isDefined(statement.leadingTrivia);
    Assert.isDefined(result.rootNode.trailingTrivia);
    Assert.areEqual(6 + content.length, reader.currentOffset);
    const parser = TypeScriptParserFixture.create("await using first = ; next;");
    const original = parser.currentNode;
    parser.lookAhead(() => { parser.parseStatement(); return true; });
    Assert.areEqual(original, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(original, parser.currentNode);
    parser.parseStatement();
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1109", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public retainsInheritedAwaitAndYieldInterpretationInInitializers(): void {
    const result = TypeScriptParser.parse("async function f(){ await using value = await resource; } function* g(){ using value = yield resource; }");
    Assert.areEqual(2, result.rootNode.children.length);
    for (const node of result.rootNode.children) {
      Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
      Assert.isInstanceOf(node.bodyNode?.children[0], TypeScriptVariableStatementNode);
    }
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public parsesDeclarationListsAndTerminators(): void {
    const parser = TypeScriptParserFixture.create("const first = 1, second = 2;");
    const unterminatedParser = TypeScriptParserFixture.create("let value");
    const missingNameParser = TypeScriptParserFixture.create("const;");
    const node = parser.parseStatement();
    const unterminatedNode = unterminatedParser.parseStatement();
    const missingNameNode = missingNameParser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptVariableStatementNode);
    Assert.areEqual(2, node.declarationListNode.children.length);
    Assert.areEqual(1, node.declarationListNode.commaNodes.length);
    Assert.isDefined(node.semicolonNode);
    Assert.isInstanceOf(unterminatedNode, TypeScriptVariableStatementNode);
    Assert.isUndefined(unterminatedNode.semicolonNode);
    Assert.isInstanceOf(missingNameNode, TypeScriptVariableStatementNode);
    Assert.areEqual(0, missingNameNode.declarationListNode.children.length);
    Assert.areEqual("TS1123", missingNameParser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
