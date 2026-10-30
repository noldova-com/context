/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptArrayBindingPatternNode,
  TypeScriptBindingElementNode,
  TypeScriptBindingPatternNode,
  TypeScriptComputedPropertyNameNode,
  TypeScriptDefaultKeywordNode,
  TypeScriptFunctionDeclarationNode,
  TypeScriptFunctionTypeNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNumericLiteralNode,
  TypeScriptObjectBindingPatternNode,
  TypeScriptOmittedExpressionNode,
  TypeScriptParameterNode,
  TypeScriptParser,
  TypeScriptPrivateIdentifierNode,
  TypeScriptStringLiteralNode,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class BindingNameParserTests {
  @TestData("let { a: } = x;", "a:", "TS1003@9:1")
  @TestData("let { 1 } = x;", "1", "TS1005@8:1")
  @TestData("let [...] = x;", "...", "TS1003@8:1")
  @TestData("let { ... } = x;", "...", "TS1003@10:1")
  @TestMethod
  public endsAnElementWithoutANameAtItsLastWrittenPart(content: string, expectedText: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statementNode = result.rootNode.children[0];
    Assert.isInstanceOf(statementNode, TypeScriptVariableStatementNode);
    const patternNode = statementNode.declarationListNode.children[0]?.nameNode;
    Assert.isInstanceOf(patternNode, TypeScriptBindingPatternNode);
    const elementNode = patternNode.children[0];
    Assert.isInstanceOf(elementNode, TypeScriptBindingElementNode);

    Assert.areEqual(expectedText, content.slice(elementNode.span.startOffset, elementNode.span.endOffset));
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public leavesAnEnclosingParameterCloserOutsideAnIncompleteObjectPattern(): void {
    const result = TypeScriptParser.parse("function f({) {}");
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1180", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(12, result.diagnostics[0]?.location?.start);
  }

  @TestData("var #name = value;", 4)
  @TestData("const #name;", 6)
  @TestMethod
  public retainsPrivateVariableNamesWithTheirSpecificDiagnostic(content: string, start: number): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.nameNode, TypeScriptPrivateIdentifierNode);
    Assert.areEqual(start, declaration.nameNode.span.startOffset);
    Assert.areEqual(5, declaration.nameNode.span.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS18029", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(5, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public placesAnElidedElementWhereTheCommaThatEndsItStarts(): void {
    const result = TypeScriptParser.parse("let [, b] = x;");

    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declaration = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declaration, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declaration.nameNode, TypeScriptArrayBindingPatternNode);
    const elidedNode = declaration.nameNode.children[0];
    Assert.isInstanceOf(elidedNode, TypeScriptOmittedExpressionNode);
    Assert.areEqual(5, elidedNode.span.startOffset);
    Assert.areEqual(0, elidedNode.span.length);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public parsesNestedArrayAndObjectBindingNames(): void {
    const parser = TypeScriptParserFixture.create("([{ nested }, [value]], { source: target = fallback }) => void");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    const arrayParameterNode = node.parameterListNode.children[0];
    const objectParameterNode = node.parameterListNode.children[1];
    Assert.isInstanceOf(arrayParameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(objectParameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(arrayParameterNode.nameNode, TypeScriptArrayBindingPatternNode);
    Assert.isInstanceOf(objectParameterNode.nameNode, TypeScriptObjectBindingPatternNode);
    Assert.areEqual("", parser.context.diagnosticCollector.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public readsLiteralComputedAndKeywordPropertyKeysInAnObjectPattern(): void {
    const result = TypeScriptParser.parse("function f({ 1: value, [key]: target, default: other }) {}");
    const functionNode = result.rootNode.children[0];

    Assert.isInstanceOf(functionNode, TypeScriptFunctionDeclarationNode);
    const parameterNode = functionNode.parameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(parameterNode.nameNode, TypeScriptObjectBindingPatternNode);
    Assert.areEqual(3, parameterNode.nameNode.children.length);
    const [numericNode, computedNode, keywordNode] = parameterNode.nameNode.children;
    Assert.isInstanceOf(numericNode, TypeScriptBindingElementNode);
    Assert.isInstanceOf(numericNode.propertyNameNode, TypeScriptNumericLiteralNode);
    Assert.isDefined(numericNode.colonNode);
    Assert.isInstanceOf(computedNode, TypeScriptBindingElementNode);
    Assert.isInstanceOf(computedNode.propertyNameNode, TypeScriptComputedPropertyNameNode);
    Assert.isDefined(computedNode.colonNode);
    Assert.isInstanceOf(keywordNode, TypeScriptBindingElementNode);
    Assert.isInstanceOf(keywordNode.propertyNameNode, TypeScriptDefaultKeywordNode);
    Assert.isDefined(keywordNode.colonNode);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public requiresAColonAfterAStringPropertyKeyInAnObjectPattern(): void {
    const result = TypeScriptParser.parse('function f({ "key" value }) {}');
    const functionNode = result.rootNode.children[0];

    Assert.isInstanceOf(functionNode, TypeScriptFunctionDeclarationNode);
    const parameterNode = functionNode.parameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);
    Assert.isInstanceOf(parameterNode.nameNode, TypeScriptObjectBindingPatternNode);
    const elementNode = parameterNode.nameNode.children[0];
    Assert.isInstanceOf(elementNode, TypeScriptBindingElementNode);
    Assert.isInstanceOf(elementNode.propertyNameNode, TypeScriptStringLiteralNode);
    Assert.isUndefined(elementNode.colonNode);
    Assert.isInstanceOf(elementNode.nameNode, TypeScriptIdentifierNode);
    Assert.areEqual("TS1005@19:5 ':' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("let [a:b] = x;", "TS1005@6:1", 1)
  @TestData("let [first second] = value;", "TS1005@11:6", 1)
  @TestData("let [first; second] = value;", "TS1005@10:1|TS1434@12:6|TS1128@18:1|TS1128@20:1", 3)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestData("let {x y}=z;", "TS1005@7:1 ',' expected.")
  @TestData("let {,x}=z;", "TS1180@5:1 Property destructuring pattern expected.")
  @TestData("let {...}=z;", "TS1003@8:1 Identifier expected.")
  @TestData("let {default:x y}=z;", "TS1005@15:1 ',' expected.")
  @TestData("function f({x y}){}", "TS1005@14:1 ',' expected.")
  @TestData("let [#x]=v;", "TS18016@5:2 Private identifiers are not allowed outside class bodies.")
  @TestData("let { : a}=v;", "TS1180@6:1 Property destructuring pattern expected.")
  @TestMethod
  public reportsMalformedBindingPatternElementsWithinTheirStatement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("var [...x = a] = a; var [a, ...b = 1] = c; var {...d = 1} = e; function f([...g = 1]) {} function b(...[...foo = []]: string[]) {}", "TS1186:=,TS1186:=,TS1186:=,TS1186:=,TS1186:=")
  @TestMethod
  public refusesADefaultOnARestElement(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("let { a = <{ ... }>x } = y;", "TS1131:...,TS1003:},TS1005:>,TS1128:},TS1128:=")
  @TestData("let [a = <{ , }>x] = y;", "TS1131:,,TS1181:},TS1109:>,TS1005:],TS1128:=")
  @TestMethod
  public endsAListItHoldsAtAnElementsStart(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }

  @TestData("declare const x: any, a: any, b: any; for (var { c = a in b } = x;;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var [c = a in b] = x;;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (let [c = a in b] = x;;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = function (this: any, { c = a in b }) {};;) {}", "")
  @TestMethod
  public readsInAsAnOperatorWithinAPattern(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public writesAMissingPropertyNameAfterARestMarkerWithoutAName(): void {
    const result = TypeScriptParser.parse("let { ... } = x;");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptVariableStatementNode);
    const declarationNode = statement.declarationListNode.children[0];
    Assert.isInstanceOf(declarationNode, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declarationNode.nameNode, TypeScriptObjectBindingPatternNode);
    const elementNode = declarationNode.nameNode.children[0];
    Assert.isInstanceOf(elementNode, TypeScriptBindingElementNode);
    Assert.isInstanceOf(elementNode.propertyNameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(9, elementNode.propertyNameNode.span.startOffset);
    Assert.areEqual(0, elementNode.propertyNameNode.span.length);
    Assert.areEqual("TS1003@10:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("let [...] = x;", 5, 8)
  @TestData("let {a: } = x;", 5, 7)
  @TestData("let {a: 5} = x;", 5, 7)
  @TestData("let { ...} = x;", 6, 9)
  @TestMethod
  public writesAMissingNameWhereABindingElementLacksOne(content: string, elementStart: number, nameOffset: number): void {
    const statementNode = TypeScriptParser.parse(content).rootNode.children[0];
    Assert.isInstanceOf(statementNode, TypeScriptVariableStatementNode);
    const patternNode = statementNode.declarationListNode.children[0]?.nameNode;
    Assert.isInstanceOf(patternNode, TypeScriptBindingPatternNode);
    const elementNode = patternNode.children[0];
    Assert.isInstanceOf(elementNode, TypeScriptBindingElementNode);

    Assert.isInstanceOf(elementNode.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(nameOffset, elementNode.nameNode.span.startOffset);
    Assert.areEqual(0, elementNode.nameNode.span.length);
    Assert.areEqual(elementStart, elementNode.span.startOffset);
    Assert.areEqual(nameOffset, elementNode.span.endOffset);
  }

  @TestData("let [a )", "[a )")
  @TestData("let { a )", "{ a )")
  @TestMethod
  public endsAPatternAtATokenItsListSkipped(content: string, expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptVariableStatementNode);
    const declarationNode = node.declarationListNode.children[0];
    Assert.isInstanceOf(declarationNode, TypeScriptVariableDeclarationNode);
    Assert.areEqual(expected, parser.context.source.getText(declarationNode.nameNode.span));
  }
}
