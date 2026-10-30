/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptMissingTypeNode,
  TypeScriptParser,
  TypeScriptTryStatementNode,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class VariableDeclarationParserTests {
  @TestData("using value! = resource;", true, "TS1263")
  @TestData("using value\n!other;", false, "TS1155")
  @TestData("using {value} = resource;", false, "TS1492")
  @TestMethod
  public consumesDefiniteAssignmentOnlyAfterASameLineIdentifier(content: string, hasExclamation: boolean, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.areEqual(hasExclamation, !Object.isUndefined(declaration.exclamationNode));
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public leavesACatchClosingParenthesisForItsOwnerAfterAMissingType(): void {
    const result = TypeScriptParser.parse("try {} catch(error: ) {}");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptTryStatementNode);
    Assert.isInstanceOf(node.catchClauseNode?.variableDeclarationNode?.typeNode, TypeScriptMissingTypeNode);
    Assert.isDefined(node.catchClauseNode?.closeParenthesisNode);
    Assert.isDefined(node.catchClauseNode?.blockNode.openBraceNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1110", result.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public parsesBindingTypesAndInitializers(): void {
    const node = TypeScriptParserFixture.create("let { source: target }: Value = initializer;").parseStatement();

    Assert.isInstanceOf(node, TypeScriptVariableStatementNode);
    const declarationNode = node.declarationListNode.children[0];
    Assert.isInstanceOf(declarationNode, TypeScriptVariableDeclarationNode);
    Assert.isDefined(declarationNode.typeNode);
    Assert.isDefined(declarationNode.initializerNode);
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = () => { try {} catch (c = a in b) {} };;) {}", "TS1005@79:2|TS1128@88:1|TS1128@91:1")
  @TestMethod
  public holdsTheInRestrictionThroughACatchBinding(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
