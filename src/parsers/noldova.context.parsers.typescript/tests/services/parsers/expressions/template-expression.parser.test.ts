/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptNoSubstitutionTemplateLiteralNode,
  TypeScriptParser,
  TypeScriptTaggedTemplateExpressionNode,
  TypeScriptTemplateExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TemplateExpressionParserTests {
  @TestMethod
  public parsesNoSubstitutionAndSubstitutionTemplates(): void {
    const literalNode = TypeScriptParserFixture.create("`text`").parseExpression();
    const templateNode = TypeScriptParserFixture.create("`before${first}middle${second}after`").parseExpression();
    const taggedNode = TypeScriptParserFixture.create("tag`before${value}after`").parseExpression();

    Assert.isInstanceOf(literalNode, TypeScriptNoSubstitutionTemplateLiteralNode);
    Assert.isInstanceOf(templateNode, TypeScriptTemplateExpressionNode);
    Assert.areEqual(2, templateNode.children.length);
    Assert.isInstanceOf(taggedNode, TypeScriptTaggedTemplateExpressionNode);
  }

  @TestMethod
  public reportsAMissingSubstitutionCloser(): void {
    const parser = TypeScriptParserFixture.create("`before${value");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptTemplateExpressionNode);
    Assert.areEqual("TS1005@14:0 '}' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("const a=`x${}`;", "TS1109@12:1 Expression expected.")
  @TestData("const a=`x${", "TS1109@12:0 Expression expected.")
  @TestData("const a=tag`x${}`;", "TS1109@15:1 Expression expected.")
  @TestData("tag`x${ \n", "TS1109@7:0 Expression expected.|TS1005@9:0 '}' expected.")
  @TestMethod
  public reportsAMissingSubstitutionExpression(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestData("declare const x: any, a: any, b: any; for (var k = `${a in b}`;;) {}", "")
  @TestData("declare const x: any, a: any, b: any; for (var k = x`${a in b}`;;) {}", "")
  @TestMethod
  public readsInAsAnOperatorInASpan(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
