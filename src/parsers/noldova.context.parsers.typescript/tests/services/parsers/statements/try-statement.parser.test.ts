/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as api from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TryStatementParserTests {
  @TestData("try {} catch {}")
  @TestData("try {} finally {}")
  @TestData("try {} catch(e) {} finally {}")
  @TestMethod
  public preservesTryCatchAndFinallyRoles(content: string): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    Assert.isDefined(node.tryKeywordNode);
    Assert.isDefined(node.tryBlockNode.openBraceNode);
    Assert.areEqual(content.length, node.span.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("try", "TS1005", 3)
  @TestData("try {}", "TS1472", 6)
  @TestData("try {} finally", "TS1005", 14)
  @TestData("try {} finally x;", "TS1005", 15)
  @TestData("try {} {}", "TS1472", 7)
  @TestData("catch(e) {}", "TS1005", 0)
  @TestData("finally {}", "TS1005", 0)
  @TestMethod
  public recoversMissingTryBodiesAndHandlers(content: string, code: string, start: number): void {
    const result = api.TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], api.TypeScriptTryStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
  }

  @TestData("try finally {}", 3)
  @TestData("try\nfinally {}", 3)
  @TestData("catch {}", 0)
  @TestData("finally {}", 0)
  @TestMethod
  public writesAnEmptyTryBodyWhereItsOpeningBraceIsMissing(content: string, offset: number): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    Assert.isUndefined(node.tryBlockNode.openBraceNode);
    Assert.areEqual(0, node.tryBlockNode.children.length);
    Assert.areEqual(offset, node.tryBlockNode.span.startOffset);
    Assert.areEqual(0, node.tryBlockNode.span.length);
  }

  @TestData("try {}", 6)
  @TestData("try {} finally", 14)
  @TestData("try {} finally x;", 14)
  @TestMethod
  public writesAnEmptyFinallyBodyWhereItsOpeningBraceIsMissing(content: string, offset: number): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    Assert.isInstanceOf(node.finallyBlockNode, api.TypeScriptBlockNode);
    Assert.isUndefined(node.finallyBlockNode.openBraceNode);
    Assert.areEqual(0, node.finallyBlockNode.children.length);
    Assert.areEqual(offset, node.finallyBlockNode.span.startOffset);
    Assert.areEqual(0, node.finallyBlockNode.span.length);
    Assert.areEqual(offset, node.span.endOffset);
  }

  @TestMethod
  public keepsARecoveredFinallyBodyWithoutInventingAKeyword(): void {
    const result = api.TypeScriptParser.parse("try {} {}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    Assert.isUndefined(node.finallyKeywordNode);
    Assert.isDefined(node.finallyBlockNode);
  }

  @TestMethod
  public linksMissingClosingBracesToTheWrittenOpeningBrace(): void {
    const result = api.TypeScriptParser.parse("try { run();");
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1007", result.diagnostics[0]?.relatedInformation[0]?.message.code.displayText);
    Assert.areEqual(4, result.diagnostics[0]?.relatedInformation[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.relatedInformation[0]?.location?.length);
  }

  @TestMethod
  public retainsGrammarContextsAcrossBodies(): void {
    const content = "async function f(){try{await x;}catch(e){await y;}finally{await z;}} function* g(){try{yield x;}catch(e){yield y;}}";
    const result = api.TypeScriptParser.parse(content);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(2, result.rootNode.children.length);
  }

  @TestMethod
  public restoresRelatedDiagnosticsAndNavigationAfterTentativeParsing(): void {
    const parser = TypeScriptParserFixture.create("try { run();");
    const first = parser.currentNode;
    parser.lookAhead(() => {
      parser.parseStatement();
      Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics[0]?.relatedInformation.length);
      return true;
    });
    Assert.areEqual(first, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(first, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public stopsNestedTryBlocksAtTheRecursionLimit(): void {
    const result = api.TypeScriptParser.parse("try {".repeat(600) + "run();" + "} finally {}".repeat(600));
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX2000", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public startsAStatementWithoutItsKeywordAtItsMissingTryBody(): void {
    const result = api.TypeScriptParser.parse("x;  catch {}");
    const statement = result.rootNode.children[1];

    Assert.isInstanceOf(statement, api.TypeScriptTryStatementNode);
    Assert.isUndefined(statement.tryKeywordNode);
    Assert.areEqual(2, statement.tryBlockNode.span.startOffset);
    Assert.areEqual(0, statement.tryBlockNode.span.length);
    Assert.areEqual(2, statement.span.startOffset);
    Assert.areEqual(12, statement.span.endOffset);
  }
}
