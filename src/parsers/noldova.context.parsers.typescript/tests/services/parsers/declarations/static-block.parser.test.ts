/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptAwaitExpressionNode,
  TypeScriptClassExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptMethodDeclarationNode,
  TypeScriptParser,
  TypeScriptStaticBlockNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";
import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class StaticBlockParserTests {
  @TestMethod
  public parsesAwaitSyntaxAndRestoresTheEnclosingGeneratorContext(): void {
    const parser = TypeScriptParserFixture.create("class { static { await /pattern/; yield; } }", TypeScriptContextFlags.Yield);
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptClassExpressionNode);
    const block = node.bodyNode.children[0];
    Assert.isInstanceOf(block, TypeScriptStaticBlockNode);
    const statement = block.bodyNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptAwaitExpressionNode);
    Assert.areEqual(2, block.bodyNode.children.length);
    Assert.areEqual(TypeScriptContextFlags.Yield, parser.context.contextFlags);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS18037", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestMethod
  public distinguishesStaticBlocksFromMethodsNamedStatic(): void {
    const bodyNode = ClassBodyParserFixture.parse("class { @decorator static {} static() {} }");

    Assert.isInstanceOf(bodyNode.children[0], TypeScriptStaticBlockNode);
    Assert.areEqual(1, bodyNode.children[0].modifierNodes.length);
    Assert.isInstanceOf(bodyNode.children[1], TypeScriptMethodDeclarationNode);
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = class { static { a in b; } };;) {}", "TS1434@68:1|TS1128@70:2|TS1005@78:1|TS1128@81:1")
  @TestMethod
  public holdsTheInRestrictionThroughItsBody(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C { static { await; } }", "TS1109@24:1 Expression expected.")
  @TestData("class C { static { let await = 1; } }", "TS1359@23:5 Identifier expected. 'await' is a reserved word that cannot be used here.")
  @TestData("class C { static { type T = { m(a = await): void }; } }", "TS2371@32:9 A parameter initializer is only allowed in a function or constructor implementation.")
  @TestData("class C { static { interface I { m(a = await): void } } }", "TS2371@35:9 A parameter initializer is only allowed in a function or constructor implementation.")
  @TestData("class C { static { let x: typeof await; } }", "")
  @TestData("class C { static { enum E { A = await } } }", "")
  @TestMethod
  public readsAwaitAsANameWhereTheAwaitContextIsLeft(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
