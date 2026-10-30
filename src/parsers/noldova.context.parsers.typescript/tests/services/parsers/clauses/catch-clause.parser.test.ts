/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValueNode } from "@noldova/context.parsers";
import * as api from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";

@TestClass
export class CatchClauseParserTests {
  @TestMethod
  public recoversAnExtraCatchBindingWithoutManufacturingClosingTokenExpressions(): void {
    const result = api.TypeScriptParser.parse("try {} catch (e, f) {}");
    Assert.areEqual(3, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], api.TypeScriptTryStatementNode);
    Assert.isInstanceOf(result.rootNode.children[1], api.TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(result.rootNode.children[2], api.TypeScriptBlockNode);
    Assert.areEqual(3, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(15, result.diagnostics[0]?.location?.start);
    Assert.areEqual("TS1434", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(17, result.diagnostics[1]?.location?.start);
    Assert.areEqual("TS1128", result.diagnostics[2]?.code.displayText);
    Assert.areEqual(18, result.diagnostics[2]?.location?.start);
  }

  @TestMethod
  public preservesTheBlockAfterARejectedCatchAssertionAndMissingUnaryOperand(): void {
    const result = api.TypeScriptParser.parse("try {} catch (e!) {}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    const declaration = node.catchClauseNode?.variableDeclarationNode;
    Assert.isInstanceOf(declaration, api.TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.nameNode, ValueNode);
    Assert.areEqual("e", declaration.nameNode.value);
    Assert.isUndefined(declaration.exclamationNode);
    Assert.areEqual(3, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[2], api.TypeScriptBlockNode);
    Assert.areEqual("TS1005@15:1|TS1109@16:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("try {} catch {}")
  @TestData("try {} catch(e) {}")
  @TestData("try {} catch({message}) {}")
  @TestData("try {} catch([error]) {}")
  @TestMethod
  public acceptsBindinglessAndDestructuredCatchForms(content: string): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    Assert.isInstanceOf(node.catchClauseNode, api.TypeScriptCatchClauseNode);
    Assert.isDefined(node.catchClauseNode.blockNode.closeBraceNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public retainsTypeAnnotationsAndReportsAWrittenInitializer(): void {
    const result = api.TypeScriptParser.parse("try {} catch(error: unknown = fallback) {}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    const declaration = node.catchClauseNode?.variableDeclarationNode;
    Assert.isInstanceOf(declaration, api.TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.nameNode, ValueNode);
    Assert.areEqual("error", declaration.nameNode.value);
    Assert.isDefined(declaration.colonNode);
    Assert.isDefined(declaration.typeNode);
    Assert.isDefined(declaration.equalsNode);
    Assert.isDefined(declaration.initializerNode);
    Assert.isUndefined(declaration.exclamationNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1197", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(30, result.diagnostics[0]?.location?.start);
    Assert.areEqual(8, result.diagnostics[0]?.location?.length);
  }

  @TestData("try {} catch (error = fallback) {}", "TS1197@22:8")
  @TestData("try {} catch (error = a.b) {}", "TS1197@22:1")
  @TestData("try {} catch (error = (a)) {}", "TS1197@22:1")
  @TestData("try {} catch ({ a } = b) {}", "TS1197@22:1")
  @TestMethod
  public reportsAWrittenInitializerAtItsFirstToken(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("try {} catch", 12)
  @TestData("try {} catch(e)", 15)
  @TestData("try {} catch (e) x", 16)
  @TestData("try {} catch x", 12)
  @TestMethod
  public writesAnEmptyCatchBodyWhereItsOpeningBraceIsMissing(content: string, offset: number): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    Assert.isInstanceOf(node.catchClauseNode, api.TypeScriptCatchClauseNode);
    const blockNode = node.catchClauseNode.blockNode;
    Assert.isUndefined(blockNode.openBraceNode);
    Assert.areEqual(0, blockNode.children.length);
    Assert.areEqual(offset, blockNode.span.startOffset);
    Assert.areEqual(0, blockNode.span.length);
    Assert.areEqual(offset, node.catchClauseNode.span.endOffset);
    Assert.isUndefined(node.finallyBlockNode);
  }

  @TestData("try {} catch", "TS1005@12:0")
  @TestData("try {} catch()", "TS1003@13:1|TS1005@14:0")
  @TestData("try {} catch(e {}", "TS1005@15:1")
  @TestData("try {} catch(e)", "TS1005@15:0")
  @TestData("try {} catch (e) x", "TS1005@17:1")
  @TestData("try {} catch x", "TS1005@13:1")
  @TestData("try {} catch(e: ) {}", "TS1110@16:1")
  @TestMethod
  public preservesMissingBindingsTypesAndBodies(content: string, expected: string): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    Assert.isDefined(node.catchClauseNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("try {} catch () {}", 0)
  @TestData("try {} catch (: any) {}", 5)
  @TestMethod
  public writesAMissingNameWhereTheSourceLacksOne(content: string, length: number): void {
    const result = api.TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, api.TypeScriptTryStatementNode);
    const declarationNode = node.catchClauseNode?.variableDeclarationNode;

    Assert.isDefined(declarationNode);
    Assert.isInstanceOf(declarationNode.nameNode, api.TypeScriptMissingIdentifierNode);
    Assert.areEqual(14, declarationNode.nameNode.span.startOffset);
    Assert.areEqual(0, declarationNode.nameNode.span.length);
    Assert.areEqual(14, declarationNode.span.startOffset);
    Assert.areEqual(length, declarationNode.span.length);
    Assert.isUndefined(declarationNode.leadingTrivia);
    Assert.areEqual("TS1003@14:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
