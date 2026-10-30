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
  TypeScriptDecoratorNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptMissingDeclarationNode,
  TypeScriptParser,
  TypeScriptReturnStatementNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ClassParserTests {
  @TestMethod
  public readsAClassDeclarationBetweenItsTrivia(): void {
    const parser = TypeScriptParserFixture.create(" /* leading */ class Box<T> extends Base<T> implements Contract {} /* trailing */");
    const leadingTrivia = parser.currentNode.leadingTrivia;
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.areEqual("class Box<T> extends Base<T> implements Contract {}", parser.context.source.getText(node.span));
    Assert.areEqual(2, node.heritageClauseNodes.length);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
    Assert.isDefined(parser.currentNode.leadingTrivia);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesAnonymousAndNamedClasses(): void {
    const anonymousParser = TypeScriptParserFixture.create("class {}");
    const namedParser = TypeScriptParserFixture.create("class Named<Value> {}");
    const contextualParser = TypeScriptParserFixture.create("class async {}");
    const anonymousNode = anonymousParser.parseExpression();
    const namedNode = namedParser.parseExpression();
    const contextualNode = contextualParser.parseExpression();

    Assert.isInstanceOf(anonymousNode, TypeScriptClassExpressionNode);
    Assert.isUndefined(anonymousNode.nameNode);
    Assert.isInstanceOf(namedNode, TypeScriptClassExpressionNode);
    Assert.isDefined(namedNode.nameNode);
    Assert.isDefined(namedNode.typeParameterListNode);
    Assert.isInstanceOf(contextualNode, TypeScriptClassExpressionNode);
    Assert.isDefined(contextualNode.nameNode);
  }

  @TestMethod
  public reportsMissingClassBody(): void {
    const parser = TypeScriptParserFixture.create("class Named");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptClassExpressionNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(0, node.bodyNode.children.length);
    Assert.areEqual(11, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.areEqual("TS1005@11:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public keepsExpressionDecoratorsWithoutAClassInAMissingDeclaration(): void {
    const parser = TypeScriptParserFixture.create("@decorator;");
    const node = parser.parsePrimaryExpression();

    Assert.isInstanceOf(node, TypeScriptMissingDeclarationNode);
    Assert.areEqual(1, node.modifierNodes.length);
    Assert.isInstanceOf(node.modifierNodes[0], TypeScriptDecoratorNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(10, node.span.length);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual("TS1109@10:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("class {}", false, 0, "TS1211")
  @TestData("class Named<T> {}", true, 0, "")
  @TestData("class implements {}", true, 0, "TS1213")
  @TestData("class implements Contract {}", false, 1, "TS1211")
  @TestData("class implements string {}", false, 1, "TS1211")
  @TestData("class extends Base {}", false, 1, "TS1211")
  @TestData("class Named<T> extends Base<T> implements A, B {}", true, 2, "")
  @TestMethod
  public distinguishesAClassNameFromItsHeritageClauses(content: string, hasName: boolean, heritageCount: number, expectedCode: string): void {
    const declarationResult = TypeScriptParser.parse(content);
    const expressionParser = TypeScriptParserFixture.create(content);
    const expression = expressionParser.parseExpression();
    const declaration = declarationResult.rootNode.children[0];

    Assert.isInstanceOf(declaration, TypeScriptClassDeclarationNode);
    Assert.isInstanceOf(expression, TypeScriptClassExpressionNode);
    Assert.areEqual(hasName, !Object.isUndefined(declaration.nameNode));
    Assert.areEqual(hasName, !Object.isUndefined(expression.nameNode));
    Assert.areEqual(heritageCount, declaration.heritageClauseNodes.length);
    Assert.areEqual(heritageCount, expression.heritageClauseNodes.length);
    Assert.areEqual(expectedCode, declarationResult.diagnostics.map(t => t.code.displayText).join(","));
    Assert.areEqual(0, expressionParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("class", 5)
  @TestData("class A", 7)
  @TestData("class A<T>", 10)
  @TestData("class A extends B", 17)
  @TestData("class A implements C", 20)
  @TestMethod
  public retainsIncompleteDeclarationsAndReportsTheMissingBody(content: string, endOffset: number): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.isUndefined(node.bodyNode.openBraceNode);
    Assert.areEqual(endOffset, node.bodyNode.span.startOffset);
    Assert.areEqual(0, node.bodyNode.span.length);
    Assert.areEqual(endOffset, node.span.endOffset);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(endOffset, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
    Assert.areEqual("'{' expected.", result.diagnostics[0]?.message.text);
  }

  @TestMethod
  public reusesClassMembersAndFunctionBodiesInAClassDeclaration(): void {
    const result = TypeScriptParser.parse("class Box<T> { method(value: T): T { function local() {} return value; } }");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    const method = node.bodyNode.children[0];
    Assert.isInstanceOf(method, TypeScriptMethodDeclarationNode);
    Assert.isDefined(method.bodyNode);
    Assert.isInstanceOf(method.bodyNode.children[0], TypeScriptFunctionDeclarationNode);
    Assert.isInstanceOf(method.bodyNode.children[1], TypeScriptReturnStatementNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestData("class C { constructor() {} constructor() {} } class D { constructor(); constructor() {} constructor(x) {} } declare class E { constructor(); constructor(); }", "TS2392:constructor,TS2392:constructor,TS2392:constructor,TS2392:constructor,TS2392:constructor")
  @TestMethod
  public refusesASecondConstructorImplementation(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("class C { n(x): y is T { return true; } *m(); *m() {} static *s(); static *s() {} } declare class D { *m(); *p(a?, b); }", "TS1225:y,TS1222:*,TS1222:*,TS1221:*,TS1016:b")
  @TestData("abstract class A { abstract *m(); } var o = { *m() {}, n(x): y is T { return true; } };", "TS1222:*,TS1225:y")
  @TestMethod
  public readsGeneratorMethodsAndPredicatesAgainstTheirSignatures(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("class C { [0, 1]() {} set [2, 3](v) {} static [4, 5] = 1; static [6, 7]() {} get [8, 9]() { return 1; } [10, 11](a?, b) {} }", "TS1171:0, 1,TS1171:2, 3,TS1171:6, 7,TS1171:8, 9,TS1016:b")
  @TestData("abstract class A { abstract foo() {} abstract bar(); abstract [0, 1]() {} abstract z(): void {} } class B { abstract baz() {} } declare abstract class D { abstract q() {} }", "TS1245:foo,TS1245:[0, 1],TS1171:0, 1,TS1245:z,TS1244:abstract,TS1245:baz,TS1245:q,TS1183:{")
  @TestMethod
  public readsComputedNamesAndAbstractBodiesOfClassMembers(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare class C { x: await; ( }\nexport {};", "TS1068@28:1|TS1109@30:1")
  @TestData("export declare class C { x: await; ( }", "TS1068@35:1|TS1109@37:1")
  @TestData("class C { x: await; ( }\nexport {};", "TS1068@20:1")
  @TestData("abstract class C { x: await; ( }\nexport {};", "TS1068@29:1")
  @TestData("f(class { x = await }, a if (b) c);\nexport {};", "TS1005@25:2|TS1005@32:1")
  @TestData("f(class await {}, a if (b) c);\nexport {};", "TS1005@20:2|TS1434@27:1|TS1128@28:1")
  @TestMethod
  public forgetsTheAwaitNamesOnlyAnAmbientClassReads(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class implements #x {}", "TS1109@17:2|TS1005@20:1")
  @TestData("class C implements #x {}", "TS1109@19:2|TS1005@22:1")
  @TestMethod
  public readsImplementsBeforeAPrivateNameAsTheClause(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
