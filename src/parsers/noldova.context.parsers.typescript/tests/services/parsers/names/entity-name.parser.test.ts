/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptMissingIdentifierNode,
  TypeScriptParser,
  TypeScriptQualifiedNameNode,
  TypeScriptTypeQueryNode,
  TypeScriptTypeReferenceNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class EntityNameParserTests {
  @TestData("var x: a.b.c;", "")
  @TestData("var x: a.default;", "")
  @TestData("var x: a.\nb;", "")
  @TestData("var x: typeof a.b;", "")
  @TestData("import x = a.b;", "")
  @TestMethod
  public readsAQualifiedNameWhereverItIsWritten(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var x: a.;", "TS1003@9:1")
  @TestData("var x: typeof a.;", "TS1003@16:1")
  @TestData("import x = a.;", "TS1003@13:1")
  @TestMethod
  public reportsANameMissingAfterADot(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var x: .a;", "TS1110@7:1")
  @TestData("var x: typeof 1;", "TS1003@14:1")
  @TestMethod
  public reportsAMissingFirstNameByWhatThePlaceExpects(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var x: a.#b;", "TS1003@11:0")
  @TestMethod
  public readsNoPrivateNameAfterADot(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("var x: a.\nb c;", "TS1003@9:0|TS1434@10:1")
  @TestData("var x: a.\n#b c;", "TS1003@9:0|TS1005@13:1")
  @TestMethod
  public endsTheNameAtALineThatStartsAnotherStatement(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("let x: A. ;", 9, "TS1003@10:1")
  @TestData("let x: A.", 9, "TS1003@9:0")
  @TestMethod
  public writesAMissingRightNameAtTheEndOfTheDot(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const typeNode = statement.declarationListNode.children[0]?.typeNode;
    Assert.isInstanceOf(typeNode, TypeScriptTypeReferenceNode);
    Assert.isInstanceOf(typeNode.nameNode, TypeScriptQualifiedNameNode);
    Assert.isInstanceOf(typeNode.nameNode.rightNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(offset, typeNode.nameNode.rightNode.span.startOffset);
    Assert.areEqual(0, typeNode.nameNode.rightNode.span.length);
    Assert.areEqual(offset, typeNode.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("typeof ;", 6, "TS1003@7:1")
  @TestData("typeof", 6, "TS1003@6:0")
  @TestMethod
  public writesAMissingHeadNameAtTheEndOfThePrecedingToken(content: string, offset: number, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeQueryNode);
    Assert.isInstanceOf(node.expressionNameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(offset, node.expressionNameNode.span.startOffset);
    Assert.areEqual(0, node.expressionNameNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }
}
