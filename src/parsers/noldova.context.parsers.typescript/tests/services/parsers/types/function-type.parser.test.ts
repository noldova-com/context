/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptArrowNode,
  TypeScriptConstructorTypeNode,
  TypeScriptFunctionTypeNode,
  TypeScriptMissingTypeNode,
  TypeScriptParenthesizedTypeNode,
  TypeScriptParser,
  TypeScriptTypeAliasDeclarationNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class FunctionTypeParserTests {
  @TestData("(override value: Value) => Result")
  @TestData("(private value: Value) => Result")
  @TestData("(protected value: Value) => Result")
  @TestData("(public value: Value) => Result")
  @TestData("(readonly value: Value) => Result")
  @TestData("([value]: Value) => Result")
  @TestData("({value}: Value) => Result")
  @TestData("(value, other) => Result")
  @TestData("(value?: Value) => Result")
  @TestData("(value) => Result")
  @TestData("(this: Value) => Result")
  @TestMethod
  public recognizesEveryUnambiguousParameterStart(value: string): void {
    const parser = TypeScriptParserFixture.create(value);
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptFunctionTypeNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public recognizesAModifierAsAParameterStartAndRefusesTheProperty(): void {
    const result = TypeScriptParser.parse("type T = (public ...values: Value[]) => Result; type U = (value = fallback) => Result;");

    Assert.areEqual("TS1317,TS2369,TS2371", result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestMethod
  public distinguishesParenthesizedAndFunctionTypes(): void {
    const parenthesizedParser = TypeScriptParserFixture.create("(Value)");
    const functionParser = TypeScriptParserFixture.create("(value: Value) => Result");
    const emptyFunctionParser = TypeScriptParserFixture.create("() => Result");

    Assert.isInstanceOf(parenthesizedParser.parseType(), TypeScriptParenthesizedTypeNode);
    Assert.isInstanceOf(functionParser.parseType(), TypeScriptFunctionTypeNode);
    Assert.isInstanceOf(emptyFunctionParser.parseType(), TypeScriptFunctionTypeNode);
    Assert.areEqual(0, parenthesizedParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, functionParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, emptyFunctionParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesGenericAndRestFunctionTypes(): void {
    const genericParser = TypeScriptParserFixture.create("<Value>(value: Value) => Value");
    const restParser = TypeScriptParserFixture.create("(...values: Value[]) => Result");
    const genericNode = genericParser.parseType();
    const restNode = restParser.parseType();

    Assert.isInstanceOf(genericNode, TypeScriptFunctionTypeNode);
    Assert.isDefined(genericNode.typeParameterListNode);
    Assert.isInstanceOf(restNode, TypeScriptFunctionTypeNode);
    Assert.isDefined(restNode.parameterListNode.children[0]);
    Assert.areEqual(0, genericParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, restParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesConstructorTypes(): void {
    const constructorParser = TypeScriptParserFixture.create("new (value: Value) => Result");
    const abstractParser = TypeScriptParserFixture.create("abstract new <Value>() => Value");
    const constructorNode = constructorParser.parseType();
    const abstractNode = abstractParser.parseType();

    Assert.isInstanceOf(constructorNode, TypeScriptConstructorTypeNode);
    Assert.isUndefined(constructorNode.abstractKeywordNode);
    Assert.isInstanceOf(abstractNode, TypeScriptConstructorTypeNode);
    Assert.isDefined(abstractNode.abstractKeywordNode);
    Assert.isDefined(abstractNode.typeParameterListNode);
    Assert.areEqual(0, constructorParser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(0, abstractParser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("<Value> => Result", TypeScriptFunctionTypeNode, false, true, false, "TS1005@8:2 '(' expected.")
  @TestData("(value: Value)", TypeScriptFunctionTypeNode, true, false, true, "TS1005@14:0 '=>' expected.")
  @TestData("() =>", TypeScriptFunctionTypeNode, true, true, true, "TS1110@5:0 Type expected.")
  @TestData("new () =>", TypeScriptConstructorTypeNode, true, true, true, "TS1110@9:0 Type expected.")
  @TestMethod
  public reportsMissingFunctionSyntax(
    content: string,
    expectedType: typeof TypeScriptConstructorTypeNode | typeof TypeScriptFunctionTypeNode,
    hasOpenParenthesis: boolean,
    hasArrow: boolean,
    isReturnTypeMissing: boolean,
    expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf<TypeScriptConstructorTypeNode | TypeScriptFunctionTypeNode>(node, expectedType);
    Assert.areEqual(hasOpenParenthesis, !Object.isUndefined(node.parameterListNode.openParenthesisNode));
    Assert.areEqual(hasArrow, !Object.isUndefined(node.arrowNode));
    Assert.areEqual(isReturnTypeMissing, node.returnTypeNode instanceof TypeScriptMissingTypeNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("() =>", TypeScriptFunctionTypeNode, 5, "TS1110@5:0 Type expected.")
  @TestData("() =>  ", TypeScriptFunctionTypeNode, 5, "TS1110@5:0 Type expected.")
  @TestData("new () =>", TypeScriptConstructorTypeNode, 9, "TS1110@9:0 Type expected.")
  @TestData("new", TypeScriptConstructorTypeNode, 3, "TS1005@3:0 '(' expected.")
  @TestMethod
  public writesAMissingReturnTypeAtTheEndOfInput(
    content: string,
    expectedType: typeof TypeScriptConstructorTypeNode | typeof TypeScriptFunctionTypeNode,
    offset: number,
    expected: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = parser.parseType();

    Assert.isInstanceOf<TypeScriptConstructorTypeNode | TypeScriptFunctionTypeNode>(node, expectedType);
    Assert.isInstanceOf(node.returnTypeNode, TypeScriptMissingTypeNode);
    Assert.areEqual(offset, node.returnTypeNode.span.startOffset);
    Assert.areEqual(0, node.returnTypeNode.span.length);
    Assert.areEqual(offset, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public rejectsAnAmbiguousNonParameterParenthesis(): void {
    const parser = TypeScriptParserFixture.create("(42) => Result");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptParenthesizedTypeNode);
    Assert.isInstanceOf(parser.currentNode, TypeScriptArrowNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("type T = (static x) => void;", TypeScriptFunctionTypeNode, "TS1090@10:6 'static' modifier cannot appear on a parameter.")
  @TestData("type T = (static static) => void;", TypeScriptFunctionTypeNode,
    "TS1090@10:6 'static' modifier cannot appear on a parameter.|TS1212@17:6 Identifier expected. 'static' is a reserved word in strict mode.")
  @TestData("type T = (static static x) => void;", TypeScriptParenthesizedTypeNode,
    "TS1005@17:6 ')' expected.|TS1434@24:1 Unexpected keyword or identifier.|TS1128@25:1 Declaration or statement expected.|TS1128@27:2 Declaration or statement expected.|TS1109@34:1 Expression expected.")
  @TestData("type T = new (static static x) => void;", TypeScriptConstructorTypeNode, "TS1005@28:1 ',' expected.")
  @TestMethod
  public readsAStaticAfterAStaticModifierAsAParameterName(content: string, expectedType: Function & NodeType, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const aliasNode = result.rootNode.children[0];

    Assert.isInstanceOf(aliasNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(aliasNode.typeNode, expectedType);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
