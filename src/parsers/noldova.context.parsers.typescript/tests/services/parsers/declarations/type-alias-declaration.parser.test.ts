/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptIntrinsicKeywordNode,
  TypeScriptLiteralTypeNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptMissingTypeNode,
  TypeScriptParser,
  TypeScriptPrivateIdentifierNode,
  TypeScriptTypeAliasDeclarationNode,
  TypeScriptTypeReferenceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeAliasDeclarationParserTests {
  @TestMethod
  public reportsAMissingSeparatorAndRetainsBothAliases(): void {
    const result = TypeScriptParser.parse("type T = number type U = string;");

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptTypeAliasDeclarationNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1005", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("';' expected.", result.diagnostics[0]?.message.text);
    Assert.areEqual(16, result.diagnostics[0]?.location?.start);
    Assert.areEqual(4, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public parsesNamesTypeParametersAndTypes(): void {
    const parser = TypeScriptParserFixture.create("type Result<Value> = Value | undefined;");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptTypeAliasDeclarationNode);
    Assert.isDefined(node.typeParameterListNode);
    Assert.isDefined(node.equalsNode);
    Assert.isDefined(node.semicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("declare type = string;", "TS1003@13:1 Identifier expected.")
  @TestData("type Value string;", "TS1005@11:6 '=' expected.")
  @TestData("type Value =;", "TS1110@12:1 Type expected.")
  @TestMethod
  public reportsAMissingNameEqualsTokenOrType(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptTypeAliasDeclarationNode);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("type Foo = intrinsic | 1;", "TS1005@21:1")
  @TestData("type Foo = intrinsic[];", "TS1005@20:1")
  @TestData("type Foo = intrinsic<1>;", "TS1005@20:1|TS1109@23:1")
  @TestData("type Foo = intrinsic & {};", "TS1005@21:1")
  @TestData("type Foo = intrinsic extends T ? 1 : 2;", "TS1005@21:7")
  @TestData("type Foo = intrinsic\n| 1;", "TS1109@21:1")
  @TestData("type Foo = intrinsic?;", "TS1005@20:1")
  @TestData("type Foo = intrinsic!;", "TS1005@20:1|TS1109@21:1")
  @TestData("type Foo = intrinsic;\ntype Bar = intrinsic | 2;", "TS1005@43:1")
  @TestData("export type Foo = intrinsic | 1;", "TS1005@28:1")
  @TestData("type Foo = intrinsic;", "")
  @TestData("type Foo<T> = intrinsic;", "")
  @TestData("type Foo =\nintrinsic;", "")
  @TestData("type Foo = intrinsic.x;", "")
  @TestData("type Foo = intrinsic\n.x;", "")
  @TestData("type Foo = (intrinsic);", "")
  @TestData("let x: intrinsic | 1;", "")
  @TestData("type Foo = intr\\u0069nsic;", "TS1260@11:14")
  @TestData("type Foo = intr\\u{69}nsic | 1;", "TS1260@11:14|TS1005@26:1")
  @TestData("type Foo = intr\\u0069nsic.x;", "")
  @TestMethod
  public readsIntrinsicWrittenAloneAsTheKeyword(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestMethod
  public keepsTheIntrinsicKeywordAsTheAliasedType(): void {
    const keywordNode = TypeScriptParser.parse("type Foo = intrinsic;").rootNode.children[0];
    const referenceNode = TypeScriptParser.parse("type Foo = intrinsic.x;").rootNode.children[0];

    Assert.isInstanceOf(keywordNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(keywordNode.typeNode, TypeScriptIntrinsicKeywordNode);
    Assert.isInstanceOf(referenceNode, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(referenceNode.typeNode, TypeScriptTypeReferenceNode);
  }

  @TestData("type Value<Type>", 16, "TS1005@16:0 '=' expected.")
  @TestData("type Value", 10, "TS1005@10:0 '=' expected.")
  @TestData("declare type", 12, "TS1003@12:0 Identifier expected.")
  @TestMethod
  public endsAnIncompleteAliasAtItsLastWrittenPart(content: string, endOffset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptTypeAliasDeclarationNode);
    Assert.areEqual(endOffset, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestData("declare type = 1;", "TS1003@13:1 Identifier expected.")
  @TestData("declare type class = 1;", "TS1359@13:5 Identifier expected. 'class' is a reserved word that cannot be used here.|TS1005@19:1 ';' expected.")
  @TestMethod
  public writesAMissingNameWhereTheSourceLacksOne(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(12, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public keepsAPrivateIdentifierWrittenAsItsName(): void {
    const result = TypeScriptParser.parse("declare type #x = 1;");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptPrivateIdentifierNode);
    Assert.isInstanceOf(node.typeNode, TypeScriptLiteralTypeNode);
    Assert.areEqual("TS18016@13:2", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("type T = ;", 10, "TS1110@9:1")
  @TestData("type T =", 8, "TS1110@8:0")
  @TestMethod
  public writesAMissingTypeWhereTheSourceLacksOne(content: string, endOffset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptTypeAliasDeclarationNode);
    Assert.isInstanceOf(node.typeNode, TypeScriptMissingTypeNode);
    Assert.areEqual(8, node.typeNode.span.startOffset);
    Assert.areEqual(0, node.typeNode.span.length);
    Assert.areEqual(endOffset, node.span.endOffset);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
