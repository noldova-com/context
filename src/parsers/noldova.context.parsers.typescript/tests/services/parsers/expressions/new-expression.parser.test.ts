/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptMetaPropertyNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNewExpressionNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class NewExpressionParserTests {
  @TestMethod
  public reportsAnOptionalChainOnTheConstructorExpression(): void {
    const parser = TypeScriptParserFixture.create("new C?.()");
    parser.parseExpression();
    const diagnostic = parser.context.diagnosticCollector.diagnostics[0];
    Assert.isDefined(diagnostic);
    Assert.areEqual("TS1209", diagnostic.code.displayText);
    Assert.areEqual(5, diagnostic.location?.start);
    Assert.areEqual(2, diagnostic.location?.length);
    Assert.areEqual("Invalid optional chain from new expression. Did you mean to call 'C()'?", diagnostic.message.text);
  }

  @TestData("new super;", "")
  @TestData("new super();", "")
  @TestData("new super<number>();", "")
  @TestData("new super<number>;", "")
  @TestData("new super`x`;", "")
  @TestData("new super<number>`x`;", "")
  @TestData("new super!;", "")
  @TestData("new super!.x();", "")
  @TestData("new super.x();", "")
  @TestData("new super\n.x;", "")
  @TestData("new super[0]();", "")
  @TestData("new new super;", "")
  @TestData("new new super();", "")
  @TestData("new new new super;", "")
  @TestData("new super?.x();", "TS1209@46:2 Invalid optional chain from new expression. Did you mean to call 'super()'?")
  @TestData("new super?.();", "TS1209@46:2 Invalid optional chain from new expression. Did you mean to call 'super()'?")
  @TestData("new super?.[0];", "TS1209@46:2 Invalid optional chain from new expression. Did you mean to call 'super()'?")
  @TestData("new super<number>?.x;", "TS1209@54:2 Invalid optional chain from new expression. Did you mean to call 'super()'?")
  @TestData("new super<number>.x();", "TS1477@46:8 An instantiation expression cannot be followed by a property access.")
  @TestData("new super<number>.;", "TS1477@46:8 An instantiation expression cannot be followed by a property access.|TS1003@55:1 Identifier expected.")
  @TestMethod
  public readsASuperTargetAsTheBareKeyword(statement: string, expected: string): void {
    const result = TypeScriptParser.parse("class B {} class A extends B { m() { " + statement + " } }");

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(2, result.rootNode.children.length);
  }

  @TestData("new import(\"a\");", "TS1109@15:6", 3, 14)
  @TestData("new import(\"a\")();", "TS1109@15:6", 3, 14)
  @TestData("new import.meta.x();", "TS1109@15:6", 3, 14)
  @TestData("new import.meta;", "TS1109@15:6", 3, 14)
  @TestData("new import.defer(\"a\");", "TS1109@15:6", 3, 14)
  @TestData("new import<T>(\"a\");", "TS1109@15:6", 3, 14)
  @TestData("new import;", "TS1109@15:6", 3, 14)
  @TestData("new import", "TS1109@15:6", 2, 14)
  @TestData("new new import(\"a\");", "TS1109@19:6", 3, 18)
  @TestData("new import?.x;", "TS1109@15:6|TS1128@21:2", 3, 14)
  @TestData("var x = new import(\"a\") + 1;", "TS1109@23:6", 3, 22)
  @TestMethod
  public reportsAnImportTarget(statement: string, expected: string, statementCount: number, keywordEnd: number): void {
    const result = TypeScriptParser.parse("export {}; " + statement);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual("Expression expected.", result.diagnostics[0]?.message.text);
    Assert.areEqual(keywordEnd, result.rootNode.children[1]?.span.endOffset);
    Assert.areEqual(statementCount, result.rootNode.children.length);
  }

  @TestMethod
  public parsesConstructionForms(): void {
    const newNode = TypeScriptParserFixture.create("new Target<Value>(value)").parseExpression();
    const nestedNode = TypeScriptParserFixture.create("new new Target()()").parseExpression();
    const argumentlessNode = TypeScriptParserFixture.create("new Target.member").parseExpression();

    Assert.isInstanceOf(newNode, TypeScriptNewExpressionNode);
    Assert.isInstanceOf(nestedNode, TypeScriptNewExpressionNode);
    Assert.isInstanceOf(argumentlessNode, TypeScriptNewExpressionNode);
  }

  @TestMethod
  public parsesNewTarget(): void {
    const newTargetNode = TypeScriptParserFixture.create("new.target").parseExpression();

    Assert.isInstanceOf(newTargetNode, TypeScriptMetaPropertyNode);
  }

  @TestMethod
  public reportsMissingNewTargetName(): void {
    const parser = TypeScriptParserFixture.create("new.");

    parser.parseExpression();

    Assert.areEqual("TS1003", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public reportsInvalidNewMetaProperties(): void {
    const parser = TypeScriptParserFixture.create("new.value");

    parser.parseExpression();
    const nodeGrammarDiagnostics = TypeScriptGrammarFixture.getDiagnostics(parser);

    Assert.areEqual("TS17013", nodeGrammarDiagnostics[0]?.code.displayText);
    Assert.areEqual("TS17012", nodeGrammarDiagnostics[1]?.code.displayText);
  }

  @TestMethod
  public writesAMissingMetaPropertyNameAtTheEndOfTheDot(): void {
    const node = TypeScriptParserFixture.create("new. ;").parseExpression();

    Assert.isInstanceOf(node, TypeScriptMetaPropertyNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptMissingIdentifierNode);
    Assert.areEqual(4, node.nameNode.span.startOffset);
    Assert.areEqual(0, node.nameNode.span.length);
    Assert.areEqual(4, node.span.endOffset);
    Assert.areEqual("TS1003@20:1", TypeScriptDiagnosticsFixture.parse("function f() { new. ; }"));
  }
}
