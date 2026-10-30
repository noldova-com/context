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
  TypeScriptComputedPropertyNameNode,
  TypeScriptDecoratorNode,
  TypeScriptDefaultKeywordNode,
  TypeScriptExportKeywordNode,
  TypeScriptIndexSignatureNode,
  TypeScriptMissingDeclarationNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptParenthesizedExpressionNode,
  TypeScriptParser,
  TypeScriptPrivateIdentifierNode,
  TypeScriptPropertyDeclarationNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class DecoratorParserTests {
  @TestMethod
  public readsWhatAPrimaryExpressionReads(): void {
    const decoratedClassNode = TypeScriptParser.parse("@@a class {} class C {}").rootNode.children[0];
    const privateNameNode = TypeScriptParser.parse("@#a class C {}").rootNode.children[0];

    Assert.isInstanceOf(decoratedClassNode, TypeScriptClassDeclarationNode);
    Assert.isInstanceOf(privateNameNode, TypeScriptClassDeclarationNode);
    const decoratedClassDecorator = decoratedClassNode.modifierNodes[0];
    const privateNameDecorator = privateNameNode.modifierNodes[0];
    Assert.isInstanceOf(decoratedClassDecorator, TypeScriptDecoratorNode);
    Assert.isInstanceOf(privateNameDecorator, TypeScriptDecoratorNode);
    Assert.isInstanceOf(decoratedClassDecorator.expressionNode, TypeScriptClassExpressionNode);
    Assert.isInstanceOf(privateNameDecorator.expressionNode, TypeScriptPrivateIdentifierNode);
  }

  @TestMethod
  public writesAMissingNameForADecoratedMemberWithoutOne(): void {
    const result = TypeScriptParser.parse("class C { @d ; }");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    const member = node.bodyNode.children[0];
    Assert.isInstanceOf(member, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(member.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(12, member.nameNode.span.startOffset);
    Assert.areEqual(0, member.nameNode.span.length);
    Assert.isDefined(member.terminatorNode);
    Assert.areEqual(1, member.modifierNodes.length);
    Assert.areEqual("TS1146@12:0", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestMethod
  public preservesDeclarationPrefixesInWrittenOrderWithoutDuplicateRoles(): void {
    const parser = TypeScriptParserFixture.create("@first export @second default class C {}");
    const statement = parser.parseStatement();
    Assert.isInstanceOf(statement, TypeScriptClassDeclarationNode);
    Assert.areEqual(4, statement.modifierNodes.length);
    Assert.isInstanceOf(statement.modifierNodes[0], TypeScriptDecoratorNode);
    Assert.isInstanceOf(statement.modifierNodes[1], TypeScriptExportKeywordNode);
    Assert.isInstanceOf(statement.modifierNodes[2], TypeScriptDecoratorNode);
    Assert.isInstanceOf(statement.modifierNodes[3], TypeScriptDefaultKeywordNode);
    Assert.areEqual(0, statement.span.startOffset);
  }

  @TestMethod
  public preservesAnOuterDecoratorAcrossNestedClassParsingAndRollback(): void {
    const text = "@factory(class Inner { @inner value:T; }) export class Outer {}";
    const parser = TypeScriptParserFixture.create(text);
    const token = parser.currentNode;
    parser.tryParse(() => {
      parser.parseStatement();
      return undefined;
    });
    Assert.areEqual(token, parser.currentNode);
    Assert.isFalse(parser.context.isDecoratorContext);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.areEqual(2, node.modifierNodes.length);
    const decorator = node.modifierNodes[0];
    Assert.isInstanceOf(decorator, TypeScriptDecoratorNode);
    Assert.areEqual("@factory(class Inner { @inner value:T; })", parser.typescriptLexer.reader.source.getText(decorator.span));
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public reportsTheMissingDeclarationAtTheEndOfItsDecorator(): void {
    const result = TypeScriptParser.parse("@d");
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptMissingDeclarationNode);
    Assert.areEqual(1, node.modifierNodes.length);
    Assert.areEqual("TS1146", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(2, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
  }

  @TestData("class C { public @d x:T; }")
  @TestData("class C { public @d method(){} }")
  @TestData("class C { public @d static {} }")
  @TestMethod
  public reportsMisplacedMemberDecoratorsWithoutLosingTheirSource(content: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1436", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf("@"), result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics[0]?.location?.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestMethod
  public permitsComputedAccessInsideDecoratorArgumentsAndNestedValues(): void {
    const result = TypeScriptParser.parse("class C { @factory(first[key], [second[key]], { value: third[key] }) method() {} }");
    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestMethod
  public reportsAnAwaitDecoratorWithoutLeakingItsGrammarContext(): void {
    const parser = TypeScriptParserFixture.create("class { @await(1) method() {} }", TypeScriptContextFlags.Await);
    parser.parseExpression();
    Assert.areEqual(TypeScriptContextFlags.Await, parser.context.contextFlags);
    Assert.isFalse(parser.context.isDecoratorContext);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(2, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1109", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1497", parser.context.diagnosticCollector.diagnostics[1]?.code.displayText);
  }

  @TestMethod
  public parsesMemberDecoratorsInSourceOrder(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { @first @second value: Value; }");
    const node = bodyNode.children[0];

    Assert.isInstanceOf(node, TypeScriptPropertyDeclarationNode);
    Assert.areEqual(2, node.modifierNodes.length);
    Assert.isInstanceOf(node.modifierNodes[0], TypeScriptDecoratorNode);
    Assert.isInstanceOf(node.modifierNodes[1], TypeScriptDecoratorNode);
  }

  @TestMethod
  public distinguishesComputedDecoratorExpressionsFromIndexSignatures(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { @(first[key]) one: Value; @(second[{ key: value }]) two: Value; @(third[key ? first : second]) three: Value; @(fourth[(value: Value) => value]) four: Value; @index [key: string]: Value; }");
    const firstNode = bodyNode.children[0];
    const secondNode = bodyNode.children[1];
    const thirdNode = bodyNode.children[2];
    const fourthNode = bodyNode.children[3];
    const indexNode = bodyNode.children[4];

    Assert.areEqual(5, bodyNode.children.length);
    Assert.isInstanceOf(firstNode, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(secondNode, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(thirdNode, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(fourthNode, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(indexNode, TypeScriptIndexSignatureNode);
    Assert.areEqual(1, firstNode.modifierNodes.length);
    const decorator = firstNode.modifierNodes[0];
    Assert.isInstanceOf(decorator, TypeScriptDecoratorNode);
    Assert.isInstanceOf(decorator.expressionNode, TypeScriptParenthesizedExpressionNode);
    Assert.areEqual(1, secondNode.modifierNodes.length);
    Assert.areEqual(1, thirdNode.modifierNodes.length);
    Assert.areEqual(1, fourthNode.modifierNodes.length);
    Assert.areEqual(1, indexNode.modifierNodes.length);
  }

  @TestMethod
  public leavesUnparenthesizedBracketsForTheComputedMember(): void {
    const body = ClassBodyParserFixture.parse("class { @decorator [key]: Value; }");
    Assert.areEqual(1, body.children.length);
    const member = body.children[0];
    Assert.isInstanceOf(member, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(member.nameNode, TypeScriptComputedPropertyNameNode);
    Assert.areEqual(1, member.modifierNodes.length);
  }

  @TestMethod
  public recoversAnIncompleteDecoratorAtTheClassBoundary(): void {
    const result = TypeScriptParser.parse("class C { @decorator");
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.areEqual(1, node.bodyNode.children.length);
    Assert.areEqual("TS1146@20:0", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }

  @TestData("export @d default class C {}", "@d")
  @TestData("export @d @e default class C {}", "@d")
  @TestData("export @d default abstract class C {}", "@d")
  @TestMethod
  public reportsADecoratorWrittenBetweenAnExportAndItsDefault(content: string, expectedText: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1206", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), result.diagnostics[0]?.location?.start);
    Assert.areEqual(expectedText.length, result.diagnostics[0]?.location?.length);
  }

  @TestData("export default @d class C {}")
  @TestData("@d export default class C {}")
  @TestData("export @d class C {}")
  @TestMethod
  public acceptsADecoratorWrittenWhereItDecoratesTheExport(content: string): void {
    Assert.areEqual(0, TypeScriptParser.parse(content).diagnostics.length);
  }
}
