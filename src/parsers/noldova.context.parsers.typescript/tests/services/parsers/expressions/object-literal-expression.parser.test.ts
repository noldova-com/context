/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptGetAccessorNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptMissingDeclarationNode,
  TypeScriptMissingExpressionNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptObjectLiteralExpressionNode,
  TypeScriptParser,
  TypeScriptPropertyAssignmentNode,
  TypeScriptPublicKeywordNode,
  TypeScriptSetAccessorNode,
  TypeScriptShorthandPropertyAssignmentNode,
  TypeScriptSpreadAssignmentNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ObjectLiteralExpressionParserTests {
  @TestData("const f = (a = {) => b;", "TS1136", 16, "Property assignment expected.")
  @TestData("const f = (a = { first ) => b;", "TS1005", 23, "',' expected.")
  @TestData("const f = (a = { first, ) => b;", "TS1136", 24, "Property assignment expected.")
  @TestData("const a = [{];", "TS1136", 12, "Property assignment expected.")
  @TestData("const a = {; const b = 1;", "TS1136", 11, "Property assignment expected.")
  @TestMethod
  public leavesEnclosingDelimitersForTheirGrammar(content: string, code: string, start: number, message: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    const diagnostic = result.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual(code, diagnostic.code.displayText);
    Assert.areEqual(start, diagnostic.location?.start);
    Assert.areEqual(1, diagnostic.location?.length);
    Assert.areEqual(message, diagnostic.message.text);
  }

  @TestMethod
  public parsesEveryObjectMemberFamily(): void {
    const parser = TypeScriptParserFixture.create("{ value: first, shorthand, shorthandDefault = fallback, ...rest, method<T>(value: T) {}, *generator() {}, async task() {}, get current() {}, set current(value) {} }");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    Assert.areEqual(9, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[1], TypeScriptShorthandPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[2], TypeScriptShorthandPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[3], TypeScriptSpreadAssignmentNode);
    Assert.isInstanceOf(node.children[4], TypeScriptMethodDeclarationNode);
    Assert.isInstanceOf(node.children[5], TypeScriptMethodDeclarationNode);
    Assert.isInstanceOf(node.children[6], TypeScriptMethodDeclarationNode);
    Assert.isInstanceOf(node.children[7], TypeScriptGetAccessorNode);
    Assert.isInstanceOf(node.children[8], TypeScriptSetAccessorNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public treatsContextualMemberWordsAsPropertiesWhenAppropriate(): void {
    const node = TypeScriptParserFixture.create("{ get: first, set, async: second, async\nvalue }").parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    Assert.isInstanceOf(node.children[0], TypeScriptPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[1], TypeScriptShorthandPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[2], TypeScriptPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[3], TypeScriptShorthandPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[4], TypeScriptShorthandPropertyAssignmentNode);
  }

  @TestMethod
  public recognizesComputedAccessorAndAsyncMethodNames(): void {
    const node = TypeScriptParserFixture.create("{ get [names[index]]() {}, async [names[index]]() {} }").parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    Assert.isInstanceOf(node.children[0], TypeScriptGetAccessorNode);
    Assert.isInstanceOf(node.children[1], TypeScriptMethodDeclarationNode);
  }

  @TestData("{ \"key\"?: value }", TypeScriptPropertyAssignmentNode, true, false, "TS1162@7:1 An object member cannot be declared optional.")
  @TestData("{ \"key\"!: value }", TypeScriptPropertyAssignmentNode, false, true,
    "TS1255@7:1 A definite assignment assertion '!' is not permitted in this context.")
  @TestData("{ method?() {} }", TypeScriptMethodDeclarationNode, true, false, "TS1162@8:1 An object member cannot be declared optional.")
  @TestData("{ method!() {} }", TypeScriptMethodDeclarationNode, false, true,
    "TS1255@8:1 A definite assignment assertion '!' is not permitted in this context.")
  @TestMethod
  public preservesAQuestionOrExclamationAfterAMemberName(
    content: string,
    memberType: typeof TypeScriptMethodDeclarationNode | typeof TypeScriptPropertyAssignmentNode,
    hasQuestion: boolean,
    hasExclamation: boolean,
    expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    Assert.areEqual(1, node.children.length);
    const memberNode = node.children[0];
    Assert.isInstanceOf<TypeScriptMethodDeclarationNode | TypeScriptPropertyAssignmentNode>(memberNode, memberType);
    Assert.areEqual(hasQuestion, !Object.isUndefined(memberNode.questionNode));
    Assert.areEqual(hasExclamation, !Object.isUndefined(memberNode.exclamationNode));
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("{ \"key\" }", "TS1005@8:1 ':' expected.")
  @TestData("{ [key] value }", "TS1005@8:5 ':' expected.")
  @TestMethod
  public reportsAMissingColonAfterAPropertyName(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    Assert.areEqual(1, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptPropertyAssignmentNode);
    Assert.isUndefined(node.children[0].colonNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public retainsAPropertyPrefixWhenItsNameAndValueAreMissing(): void {
    const result = TypeScriptParser.parse("x = { public @ }");
    const [statementNode, nextStatementNode] = result.rootNode.children;

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(statementNode, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statementNode.expressionNode, TypeScriptBinaryExpressionNode);
    const node = statementNode.expressionNode.rightNode;
    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.areEqual(1, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptShorthandPropertyAssignmentNode);
    Assert.isInstanceOf(node.children[0].nameNode, TypeScriptPublicKeywordNode);
    Assert.isInstanceOf(nextStatementNode, TypeScriptMissingDeclarationNode);
    Assert.areEqual(
      "TS1005@13:1 ',' expected.|TS1146@14:0 Declaration expected.|TS1109@15:1 Expression expected.|TS1128@15:1 Declaration or statement expected.",
      TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("const a = { public * };", "TS1003@21:1")
  @TestData("const a = { public {} };", "TS1003@19:1")
  @TestMethod
  public reportsAMissingPropertyNameAfterAWrittenPrefix(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("x = { first second }", "TS1005@12:6 ',' expected.", 1)
  @TestData("x = { first: }", "TS1109@13:1 Expression expected.", 1)
  @TestData("x = { first", "TS1005@11:0 '}' expected.", 1)
  @TestData("x = { @ }",
    "TS1136@6:1 Property assignment expected.|TS1146@7:0 Declaration expected.|TS1109@8:1 Expression expected.|TS1128@8:1 Declaration or statement expected.", 2)
  @TestData("x = { get [name", "TS1005@15:0 ']' expected.", 1)
  @TestData("const a={x:1;y:2};", "TS1005@12:1 ',' expected.", 1)
  @TestData("const a={x:1\n;y:2};", "TS1005@13:1 ',' expected.|TS1128@17:1 Declaration or statement expected.", 3)
  @TestData("const a={,x:1};", "TS1136@9:1 Property assignment expected.", 1)
  @TestData("const a={`x`:1};",
    "TS1136@9:3 Property assignment expected.|TS1005@12:1 ',' expected.|TS1134@13:1 Variable declaration expected.|TS1128@14:1 Declaration or statement expected.", 3)
  @TestData("const a={*(){}};", "TS1003@10:1 Identifier expected.", 1)
  @TestData("const a={m() +};", "TS1005@13:1 '{' expected.|TS1109@14:1 Expression expected.", 2)
  @TestData("f({[x:y]:0});", "TS1005@5:1 ']' expected.|TS1005@7:1 ',' expected.|TS1136@8:1 Property assignment expected.|TS1005@10:1 ':' expected.", 1)
  @TestMethod
  public reportsMalformedMembersAndKeepsStatementBoundaries(content: string, expectedDiagnostics: string, expectedStatements: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.length);
  }

  @TestData("var o = { [0, 1]() {}, get [2, 3]() { return 1; }, set [4, 5](v) {}, [6, 7]: 1, [(8, 9)]: 2, async [10, 11]() {}, *[12, 13]() {}, [14, 15](a?, b) {} };", "TS1171:0, 1,TS1171:2, 3,TS1171:4, 5,TS1171:6, 7,TS1171:10, 11,TS1171:12, 13,TS1171:14, 15,TS1016:b")
  @TestMethod
  public refusesACommaSequenceAsAComputedName(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("let o = { a: <{ . }>x };", "TS1131:.,TS1003:},TS1128:}")
  @TestMethod
  public endsAListItHoldsAtAMembersStart(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = { p: a in b };;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = { ...a in b };;) {}", "TS1005@58:2")
  @TestData("declare const x: any, a: any, b: any; for (var k = { a = a in b } = x;;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = { p: a in b } = x;;) {}", "TS2364@56:6")
  @TestMethod
  public readsInAsAnOperatorOnlyInAPropertyValue(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("x = { a: 1;", "TS1005@10:1|TS1005@11:0{The parser expected to find a '}' to match the '{' token here.@4}")
  @TestData("x = { a: 1 b: 2;", "TS1005@11:1|TS1005@15:1|TS1005@16:0{The parser expected to find a '}' to match the '{' token here.@4}")
  @TestData("x = {", "TS1005@5:0{The parser expected to find a '}' to match the '{' token here.@4}")
  @TestMethod
  public namesTheOpenBraceAMissingCloseWouldMatch(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithRelated(result.diagnostics));
  }

  @TestData("{ a: }", 4, "TS1109@5:1")
  @TestData("{ a: /* gap */ }", 4, "TS1109@15:1")
  @TestData("{ a:", 4, "TS1109@4:0")
  @TestMethod
  public writesAMissingInitializerAtTheEndOfTheColon(content: string, offset: number, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    const memberNode = node.children[0];
    Assert.isInstanceOf(memberNode, TypeScriptPropertyAssignmentNode);
    Assert.isInstanceOf(memberNode.initializerNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(offset, memberNode.initializerNode.span.startOffset);
    Assert.areEqual(0, memberNode.initializerNode.span.length);
    Assert.areEqual(offset, memberNode.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public startsAMemberWithoutAWrittenNameAtItsMissingName(): void {
    const parser = TypeScriptParserFixture.create("{ . }");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    const memberNode = node.children[0];
    Assert.isInstanceOf(memberNode, TypeScriptPropertyAssignmentNode);
    Assert.isInstanceOf(memberNode.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(1, memberNode.nameNode.span.startOffset);
    Assert.areEqual(0, memberNode.nameNode.span.length);
    Assert.areEqual(1, memberNode.span.startOffset);
    Assert.areEqual(3, memberNode.span.endOffset);
    Assert.areEqual("TS1003@2:1|TS1003@4:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("{ a )", "{ a )")
  @TestData("{ a: 1 ;", "{ a: 1 ;")
  @TestMethod
  public endsAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptObjectLiteralExpressionNode);
    Assert.areEqual(expected, parser.context.source.getText(node.span));
  }
}
