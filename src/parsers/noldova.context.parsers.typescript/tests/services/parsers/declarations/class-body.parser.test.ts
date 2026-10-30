/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptClassDeclarationNode, TypeScriptClassExpressionNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ClassBodyParserTests {
  @TestMethod
  public retainsExportAsWrittenClassMemberSyntax(): void {
    const result = TypeScriptParser.parse("class C {export x=1;}");
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1031", result.diagnostics[0]?.code.displayText);
    const node = result.rootNode.children[0];
    Assert.isInstanceOf(node, TypeScriptClassDeclarationNode);
    Assert.areEqual(1, node.bodyNode.children.length);
  }

  @TestMethod
  public reportsMissingClosingBrace(): void {
    const parser = TypeScriptParserFixture.create("class { value: Value");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptClassExpressionNode);
    Assert.isUndefined(node.bodyNode.closeBraceNode);
    Assert.areEqual("TS1005@20:0", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("class C { constructor?(): T; }", "TS1005@21:1|TS1068@22:1|TS1005@27:1|TS1128@29:1", 2)
  @TestData("const C=class { ...; };", "TS1068@16:3", 1)
  @TestData("class C{ constructor?(): T; method() {} }", "TS1005@20:1|TS1068@21:1|TS1005@26:1|TS1005@37:1|TS1128@40:1", 4)
  @TestData("function f(){ class C{ constructor?(): T; } after(); }", "TS1005@34:1|TS1068@35:1|TS1005@40:1|TS1128@53:1", 2)
  @TestMethod
  public preservesRecoveryDiagnosticsAndFollowingStatements(content: string, expected: string, statementCount: number): void {
    const result = TypeScriptParser.parse(content);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    Assert.areEqual(statementCount, result.rootNode.children.length);
    Assert.areEqual(content.length, result.rootNode.span.length);
  }

  @TestData("class C { a = <{ @ }>x; }", "TS1131:@,TS1109:,TS1109:},TS1109:>,TS1128:}")
  @TestMethod
  public endsAListItHoldsAtAMembersStart(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }
}
