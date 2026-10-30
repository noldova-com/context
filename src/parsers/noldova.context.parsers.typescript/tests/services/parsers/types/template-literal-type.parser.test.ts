/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptParser,
  TypeScriptTemplateLiteralTypeNode,
  TypeScriptTemplateLiteralTypeSpanNode,
  TypeScriptTemplateMiddleNode,
  TypeScriptTemplateTailNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TemplateLiteralTypeParserTests {
  @TestMethod
  public parsesTemplateTypeSpans(): void {
    const parser = TypeScriptParserFixture.create("`head${First}middle${Second}tail`");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTemplateLiteralTypeNode);
    Assert.areEqual(2, node.children.length);
    const firstSpan = node.children[0];
    const secondSpan = node.children[1];
    Assert.isInstanceOf(firstSpan, TypeScriptTemplateLiteralTypeSpanNode);
    Assert.isInstanceOf(firstSpan.literalNode, TypeScriptTemplateMiddleNode);
    Assert.isInstanceOf(secondSpan, TypeScriptTemplateLiteralTypeSpanNode);
    Assert.isInstanceOf(secondSpan.literalNode, TypeScriptTemplateTailNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public reportsInvalidEscapesDuringCommittedUntaggedReLexing(): void {
    const parser = TypeScriptParserFixture.create("`head\\xG${Value}tail`");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTemplateLiteralTypeNode);
    Assert.areEqual("TS1125@7:0 Hexadecimal digit expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestMethod
  public reportsAMissingTemplateContinuation(): void {
    const parser = TypeScriptParserFixture.create("`head${Value");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTemplateLiteralTypeNode);
    Assert.areEqual(1, node.children.length);
    Assert.isInstanceOf(node.children[0], TypeScriptTemplateLiteralTypeSpanNode);
    Assert.isUndefined(node.children[0].literalNode);
    Assert.areEqual("TS1005@12:0 '}' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("type A=`x${}`;", "TS1110@11:1 Type expected.")
  @TestData("type A=`x${", "TS1110@11:0 Type expected.")
  @TestMethod
  public reportsAMissingSpanType(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(1, result.rootNode.children.length);
  }
}
