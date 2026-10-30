/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptAsyncKeywordNode,
  TypeScriptAwaitExpressionNode,
  TypeScriptBinaryExpressionNode,
  TypeScriptBlockNode,
  TypeScriptClassDeclarationNode,
  TypeScriptEmptyStatementNode,
  TypeScriptExpressionStatementNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptFunctionExpressionNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParenthesizedExpressionNode,
  TypeScriptParser,
  TypeScriptReturnStatementNode,
  TypeScriptYieldExpressionNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class FunctionParserTests {
  @TestData("async function* ready<T>(value: T): T {}", false, true)
  @TestData("function ready<T>(value: T): T;", true, false)
  @TestData("function ready()", false, false)
  @TestMethod
  public readsAFunctionDeclarationBetweenItsTrivia(content: string, hasSemicolon: boolean, hasBody: boolean): void {
    const parser = TypeScriptParserFixture.create(` /* leading */ ${content} /* trailing */`);
    const leadingTrivia = parser.currentNode.leadingTrivia;
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.areEqual(content, parser.context.source.getText(node.span));
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
    Assert.isDefined(parser.currentNode.leadingTrivia);
    Assert.areEqual(hasSemicolon, !Object.isUndefined(node.semicolonNode));
    Assert.areEqual(hasBody, !Object.isUndefined(node.bodyNode));
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("await")
  @TestData("yield")
  @TestMethod
  public treatsContextualNamesAsIdentifiersInAnOrdinaryFunction(name: string): void {
    const parser = TypeScriptParserFixture.create(`function(${name} = 1) { return ${name} + 1; }`, TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptFunctionExpressionNode);
    Assert.isDefined(node.bodyNode);
    const statement = node.bodyNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptReturnStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.areEqual(name, parser.typescriptLexer.reader.source.getText(statement.expressionNode.leftNode.span));
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(TypeScriptContextFlags.Await | TypeScriptContextFlags.Yield, parser.context.contextFlags);
  }

  @TestData("async function", "await", TypeScriptAwaitExpressionNode)
  @TestData("function*", "yield", TypeScriptYieldExpressionNode)
  @TestMethod
  public restoresTheOuterGrammarAfterANestedOrdinaryFunction(prefix: string, name: string, expectedType: Function & NodeType): void {
    const parser = TypeScriptParserFixture.create(`${prefix}() { (function() { return ${name} + 1; }); return ${name} value; }`);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptFunctionExpressionNode);
    Assert.isDefined(node.bodyNode);
    const innerStatement = node.bodyNode.children[0];
    Assert.isInstanceOf(innerStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(innerStatement.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.isInstanceOf(innerStatement.expressionNode.expressionNode, TypeScriptFunctionExpressionNode);
    Assert.isDefined(innerStatement.expressionNode.expressionNode.bodyNode);
    const innerReturn = innerStatement.expressionNode.expressionNode.bodyNode.children[0];
    Assert.isInstanceOf(innerReturn, TypeScriptReturnStatementNode);
    Assert.isInstanceOf(innerReturn.expressionNode, TypeScriptBinaryExpressionNode);
    const outerReturn = node.bodyNode.children[1];
    Assert.isInstanceOf(outerReturn, TypeScriptReturnStatementNode);
    Assert.isInstanceOf(outerReturn.expressionNode, expectedType);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(TypeScriptContextFlags.None, parser.context.contextFlags);
  }

  @TestData("async function", "await")
  @TestData("function*", "yield")
  @TestMethod
  public parsesTypeNamesOutsideTheFunctionExpressionContext(prefix: string, name: string): void {
    const parser = TypeScriptParserFixture.create(`${prefix}() { type Result = ${name}; const value: ${name} = other; }`);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptFunctionExpressionNode);
    Assert.areEqual(2, node.bodyNode?.children.length);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(TypeScriptContextFlags.None, parser.context.contextFlags);
  }

  @TestMethod
  public parsesAnonymousNamedAsyncAndGeneratorFunctions(): void {
    const anonymousNode = TypeScriptParserFixture.create("function () {}").parseExpression();
    const namedNode = TypeScriptParserFixture.create("function named<Value>(value: Value): Value {}").parseExpression();
    const asyncGeneratorNode = TypeScriptParserFixture.create("async function* named() {}").parseExpression();

    Assert.isInstanceOf(anonymousNode, TypeScriptFunctionExpressionNode);
    Assert.isUndefined(anonymousNode.nameNode);
    Assert.isInstanceOf(namedNode, TypeScriptFunctionExpressionNode);
    Assert.isDefined(namedNode.nameNode);
    Assert.isDefined(namedNode.typeParameterListNode);
    Assert.isDefined(namedNode.returnTypeNode);
    Assert.isInstanceOf(asyncGeneratorNode, TypeScriptFunctionExpressionNode);
    Assert.isDefined(asyncGeneratorNode.modifierNodes[0]);
    Assert.isDefined(asyncGeneratorNode.asteriskNode);
  }

  @TestMethod
  public reportsAMissingFunctionExpressionBody(): void {
    const parser = TypeScriptParserFixture.create("function named()");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptFunctionExpressionNode);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(16, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.areEqual("TS1005@16:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public endsAnAsyncWordAtALineBreakBeforeFunction(): void {
    const parser = TypeScriptParserFixture.create("async\nfunction named() {}");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptAsyncKeywordNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("function ready()", false, 1)
  @TestData("function ready();", true, 1)
  @TestData("function ready(): boolean;", true, 1)
  @TestData("function ready<T>(value: T): T", false, 1)
  @TestData("function ready()\nnext();", false, 2)
  @TestData("function ready()/*\n*/next();", false, 2)
  @TestMethod
  public acceptsBodylessSignaturesAndPreservesTheirTerminator(content: string, hasSemicolon: boolean, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.isUndefined(node.bodyNode);
    Assert.isDefined(node.nameNode);
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(hasSemicolon, !Object.isUndefined(node.semicolonNode));
    Assert.areEqual(statementCount, result.rootNode.children.length);
  }

  @TestData("function ready(){};(next);", TypeScriptFunctionDeclarationNode, 18)
  @TestData("class Ready {};(next);", TypeScriptClassDeclarationNode, 14)
  @TestMethod
  public leavesAFollowingSemicolonOrParenthesizedExpressionOutsideTheDeclaration(content: string, expectedType: Function & NodeType, endOffset: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(3, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], expectedType);
    Assert.areEqual(endOffset, result.rootNode.children[0]?.span.endOffset);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptEmptyStatementNode);
    Assert.isInstanceOf(result.rootNode.children[2], TypeScriptExpressionStatementNode);
  }

  @TestMethod
  public acceptsABodylessSignatureBeforeTheEnclosingCloseBrace(): void {
    const result = TypeScriptParser.parse("{ function ready() }");
    const block = result.rootNode.children[0];

    Assert.isInstanceOf(block, TypeScriptBlockNode);
    Assert.isInstanceOf(block.children[0], TypeScriptFunctionDeclarationNode);
    Assert.isDefined(block.closeBraceNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("function () {}", "TS1003@9:1 Identifier expected.")
  @TestData("function", "TS1003@8:0 Identifier expected.")
  @TestData("function*", "TS1003@9:0 Identifier expected.")
  @TestData("function f", "TS1005@10:0 '(' expected.")
  @TestData("function f<", "TS1005@11:0 '>' expected.")
  @TestData("function f(", "TS1005@11:0 ')' expected.")
  @TestData("function f():", "TS1110@13:0 Type expected.")
  @TestMethod
  public reportsTheMissingPartOfAnIncompleteDeclaration(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptFunctionDeclarationNode);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("function f() next();", "TS1144@13:4 '{' or ';' expected.")
  @TestData("function f(): number next();", "TS1144@21:4 '{' or ';' expected.")
  @TestMethod
  public leavesAStatementWrittenAfterASignatureOutsideTheDeclaration(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptFunctionDeclarationNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("async function", "await", TypeScriptAwaitExpressionNode)
  @TestData("function*", "yield", TypeScriptYieldExpressionNode)
  @TestMethod
  public restoresDeclarationGrammarAroundANestedOrdinaryFunction(prefix: string, name: string, expectedType: Function & NodeType): void {
    const parser = TypeScriptParserFixture.create(
      `${prefix} outer() { function inner() { return ${name} + 1; } return ${name} value; }`);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.isDefined(node.bodyNode);
    const inner = node.bodyNode.children[0];
    Assert.isInstanceOf(inner, TypeScriptFunctionDeclarationNode);
    Assert.isDefined(inner.bodyNode);
    const innerReturn = inner.bodyNode.children[0];
    Assert.isInstanceOf(innerReturn, TypeScriptReturnStatementNode);
    Assert.isInstanceOf(innerReturn.expressionNode, TypeScriptBinaryExpressionNode);
    const outerReturn = node.bodyNode.children[1];
    Assert.isInstanceOf(outerReturn, TypeScriptReturnStatementNode);
    Assert.isInstanceOf(outerReturn.expressionNode, expectedType);
    Assert.areEqual(TypeScriptContextFlags.None, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public restoresContextAfterARecoveredNestedDeclaration(): void {
    const parser = TypeScriptParserFixture.create("async function outer() { function () {} return await value; }");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.isDefined(node.bodyNode);
    const inner = node.bodyNode.children[0];
    Assert.isInstanceOf(inner, TypeScriptFunctionDeclarationNode);
    Assert.isInstanceOf(inner.nameNode, TypeScriptMissingIdentifierNode);
    const outerReturn = node.bodyNode.children[1];
    Assert.isInstanceOf(outerReturn, TypeScriptReturnStatementNode);
    Assert.isInstanceOf(outerReturn.expressionNode, TypeScriptAwaitExpressionNode);
    Assert.areEqual("TS1003", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(TypeScriptContextFlags.None, parser.context.contextFlags);
  }

  @TestData("function f()\n{}", true, false, 1)
  @TestData("function f();{}", false, true, 2)
  @TestData("function f()\nnext();", false, false, 2)
  @TestMethod
  public distinguishesABodyFromASignatureBoundary(content: string, hasBody: boolean, hasSemicolon: boolean, statements: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.areEqual(hasBody, !Object.isUndefined(node.bodyNode));
    Assert.areEqual(hasSemicolon, !Object.isUndefined(node.semicolonNode));
    Assert.areEqual(statements, result.rootNode.children.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("declare function* f(); function* g(); function* g() {} declare namespace M { function* h(): any; } namespace N { function* k(); function* k() {} }", "TS1221:*,TS1222:*,TS1221:*,TS1222:*")
  @TestData("declare namespace P { function* q() {} }", "TS1221:*,TS1183:{")
  @TestData("declare function* r(a?, b) {} function* s(a?, b);", "TS1221:*,TS1016:b,TS1183:{,TS1222:*,TS1016:b")
  @TestData("declare var x = function* () {}; var y = function* () {}; var z = function* (a?, b) {};", "TS1039:function* () {},TS1221:*,TS1183:{,TS1016:b")
  @TestData("function f(x): y is T { return true; } function g(...x): x is T { return true; } function h([a]): a is T { return true; } function i({a: {b}}): b is T { return true; }", "TS1225:y,TS1229:x,TS1230:a,TS1230:b")
  @TestData("function m(x, ...y): y is T { return true; } function o(): x is T { return true; } function q({a}, ...b): a is T { return true; } function j(x): this is T { return true; }", "TS1229:y,TS1225:x,TS1230:a")
  @TestData("declare function u(x): y is T; var v = function (x): y is T { return true; }; function x2(x: number = 1): y is T { return true; } function y2(a, x): x is T { return true; } function k(x): asserts y {} function p(x): asserts z is T {}", "TS1225:y,TS1225:y,TS1225:y,TS1225:y,TS1225:z")
  @TestMethod
  public readsGeneratorsAndTypePredicatesAgainstTheirSignatures(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("function () {}", 8, "TS1003@9:1")
  @TestData("function 5() {}", 8, "TS1003@9:1|TS1005@13:1")
  @TestData("function class() {}", 8, "TS1359@9:5|TS1005@14:1|TS1005@17:1")
  @TestMethod
  public writesAMissingNameForADeclarationThatRequiresOne(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(offset, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public leavesTheNameOfADefaultExportUnwritten(): void {
    const result = TypeScriptParser.parse("export default function () {}");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.isUndefined(node.nameNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("function f {}", 10, "TS1005@11:1")
  @TestData("function f<T> {}", 13, "TS1005@14:1")
  @TestMethod
  public writesAnEmptyParameterListWhereTheOpeningParenthesisIsMissing(content: string, offset: number, expected: string): void {
    const declarationParser = TypeScriptParserFixture.create(content);
    const expressionParser = TypeScriptParserFixture.create(content);
    const declarationNode = declarationParser.parseStatement();
    const expressionNode = expressionParser.parseExpression();

    Assert.isInstanceOf(declarationNode, TypeScriptFunctionDeclarationNode);
    Assert.isInstanceOf(expressionNode, TypeScriptFunctionExpressionNode);
    for (const node of [declarationNode, expressionNode]) {
      Assert.isUndefined(node.parameterListNode.openParenthesisNode);
      Assert.areEqual(0, node.parameterListNode.children.length);
      Assert.areEqual(offset, node.parameterListNode.span.startOffset);
      Assert.areEqual(0, node.parameterListNode.span.length);
      Assert.isDefined(node.bodyNode);
      Assert.isDefined(node.bodyNode.openBraceNode);
    }
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(declarationParser.context.diagnosticCollector.diagnostics));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(expressionParser.context.diagnosticCollector.diagnostics));
  }

  @TestData("function f() 5", 12, "TS1144@13:1 '{' or ';' expected.")
  @TestData("function* g() 5", 13, "TS1144@14:1 '{' or ';' expected.")
  @TestData("function f() => 1", 12, "TS1144@13:2 '{' or ';' expected.")
  @TestMethod
  public writesAnEmptyBodyWhereADeclarationHasNeitherABodyNorATerminator(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptFunctionDeclarationNode);
    Assert.isDefined(node.bodyNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.isUndefined(node.bodyNode.closeBraceNode);
    Assert.areEqual(0, node.bodyNode.children.length);
    Assert.areEqual(offset, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.isUndefined(node.semicolonNode);
    Assert.areEqual(offset, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
