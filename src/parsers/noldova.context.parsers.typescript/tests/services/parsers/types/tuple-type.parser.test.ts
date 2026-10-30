/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptNamedTupleMemberNode,
  TypeScriptOptionalTypeNode,
  TypeScriptParser,
  TypeScriptRestTypeNode,
  TypeScriptTupleTypeNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TupleTypeParserTests {
  @TestMethod
  public parsesEmptyAndOrdinaryTuples(): void {
    const emptyParser = TypeScriptParserFixture.create("[]");
    const tupleParser = TypeScriptParserFixture.create("[string, number]");
    const emptyNode = emptyParser.parseType();
    const tupleNode = tupleParser.parseType();

    Assert.isInstanceOf(emptyNode, TypeScriptTupleTypeNode);
    Assert.areEqual(0, emptyNode.children.length);
    Assert.isInstanceOf(tupleNode, TypeScriptTupleTypeNode);
    Assert.areEqual(2, tupleNode.children.length);
    Assert.areEqual(1, tupleNode.commaNodes.length);
    Assert.areEqual(0, emptyParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, tupleParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesNamedRestAndOptionalElements(): void {
    const parser = TypeScriptParserFixture.create("[name?: string, ...rest: number[], boolean?]");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTupleTypeNode);
    Assert.areEqual(3, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptNamedTupleMemberNode);
    Assert.isDefined(node.children[0].questionNode);
    Assert.isInstanceOf(node.children[1], TypeScriptNamedTupleMemberNode);
    Assert.isDefined(node.children[1].dotDotDotNode);
    Assert.isInstanceOf(node.children[2], TypeScriptOptionalTypeNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesUnnamedRestAndPlainNamedElements(): void {
    const unnamedRestParser = TypeScriptParserFixture.create("[...string[]]");
    const namedParser = TypeScriptParserFixture.create("[name: string]");
    const unnamedRestNode = unnamedRestParser.parseType();
    const namedNode = namedParser.parseType();

    Assert.isInstanceOf(unnamedRestNode, TypeScriptTupleTypeNode);
    Assert.isInstanceOf(unnamedRestNode.children[0], TypeScriptRestTypeNode);
    Assert.isInstanceOf(namedNode, TypeScriptTupleTypeNode);
    Assert.isInstanceOf(namedNode.children[0], TypeScriptNamedTupleMemberNode);
    Assert.isUndefined(namedNode.children[0].questionNode);
    Assert.areEqual(0, unnamedRestParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, namedParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesANumericLiteralAsAnUnnamedElement(): void {
    const parser = TypeScriptParserFixture.create("[42]");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTupleTypeNode);
    Assert.areEqual(1, node.children.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("[string,, number]", true, "TS1110@8:1 Type expected.")
  @TestData("[string", false, "TS1005@7:0 ']' expected.")
  @TestMethod
  public reportsAMissingElementOrClosingBracket(content: string, hasCloseBracket: boolean, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTupleTypeNode);
    Assert.areEqual(hasCloseBracket, !Object.isUndefined(node.closeBracketNode));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("type T = ([value) => void;", "TS1005@16:1|TS1110@18:2|TS1005@25:1|TS1005@26:0", 1)
  @TestData("type T = [First Second];", "TS1005@16:6", 1)
  @TestData("type T=[First; Second];", "TS1005@13:1", 1)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestMethod
  public reportsAKeywordWrittenAsAnElementType(): void {
    const result = TypeScriptParser.parse("type T=[return];");

    Assert.areEqual("TS1110@8:6 Type expected.|TS1109@14:1 Expression expected.", TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(3, result.rootNode.children.length);
  }

  @TestData("type T = [{ , }];", "TS1131:,,TS1110:}")
  @TestMethod
  public endsAListItHoldsAtAnElementsStart(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("[a )", "[a )")
  @TestMethod
  public endsAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTupleTypeNode);
    Assert.areEqual(expected, parser.context.source.getText(node.span));
  }
}
