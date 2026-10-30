/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodeType } from "@noldova/context.parsers";
import {
  TypeScriptAwaitExpressionNode,
  TypeScriptClassExpressionNode,
  TypeScriptComputedPropertyNameNode,
  TypeScriptParser,
  TypeScriptPropertyDeclarationNode,
  TypeScriptYieldExpressionNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class PropertyDeclarationParserTests {
  @TestData("await", TypeScriptContextFlags.Await, TypeScriptAwaitExpressionNode)
  @TestData("yield", TypeScriptContextFlags.Yield, TypeScriptYieldExpressionNode)
  @TestMethod
  public separatesInitializersFromEnclosingFunctionContexts(keyword: string, flags: TypeScriptContextFlags, expectedType: Function & NodeType): void {
    const parser = TypeScriptParserFixture.create("class { field = " + keyword + "; [" + keyword + " value] = 0; }", flags);
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptClassExpressionNode);
    Assert.areEqual(2, node.bodyNode.children.length);
    const field = node.bodyNode.children[0];
    const computed = node.bodyNode.children[1];
    Assert.isInstanceOf(field, TypeScriptPropertyDeclarationNode);
    Assert.isDefined(field.initializerNode);
    Assert.isFalse(field.initializerNode instanceof TypeScriptAwaitExpressionNode);
    Assert.isFalse(field.initializerNode instanceof TypeScriptYieldExpressionNode);
    Assert.areEqual(keyword, parser.typescriptLexer.reader.source.getText(field.initializerNode.span));
    Assert.isInstanceOf(computed, TypeScriptPropertyDeclarationNode);
    Assert.isInstanceOf(computed.nameNode, TypeScriptComputedPropertyNameNode);
    Assert.isInstanceOf(computed.nameNode.expressionNode, expectedType);
    Assert.areEqual(flags, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    Assert.isTrue(parser.isEndOfFile);
  }

  @TestMethod
  public parsesOptionalAndDefiniteProperties(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { optional?: Value; definite!: Value = fallback }");
    const optionalNode = bodyNode.children[0];
    const definiteNode = bodyNode.children[1];

    Assert.isInstanceOf(optionalNode, TypeScriptPropertyDeclarationNode);
    Assert.isDefined(optionalNode.questionNode);
    Assert.isInstanceOf(definiteNode, TypeScriptPropertyDeclarationNode);
    Assert.isDefined(definiteNode.exclamationNode);
    Assert.isDefined(definiteNode.initializerNode);
    Assert.isUndefined(definiteNode.terminatorNode);
  }

  @TestData("class C{static static x;}", "TS1434@15:6 Unexpected keyword or identifier.", 1)
  @TestData("class C{x: T value;}", "TS1442@13:5 Expected '=' for property initializer.", 1)
  @TestData("class C{x: T=1 value;}", "TS1005@15:5 ';' expected.", 1)
  @TestData("class C{x @decorator y;}", "TS1436@10:1 Decorators must precede the name and all keywords of property declarations.", 1)
  @TestData("class C{x: T() {}}",
    "TS1441@12:1 Cannot start a function call in a type annotation.|TS1068@13:1 Unexpected token. A constructor, method, accessor, or property was expected.|TS1068@15:1 Unexpected token. A constructor, method, accessor, or property was expected.|TS1128@17:1 Declaration or statement expected.", 2)
  @TestMethod
  public reportsMalformedPropertyDeclarations(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
  }
}
