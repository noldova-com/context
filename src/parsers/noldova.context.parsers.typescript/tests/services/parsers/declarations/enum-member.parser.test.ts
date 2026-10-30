/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptComputedPropertyNameNode, TypeScriptEnumMemberNode, TypeScriptMissingExpressionNode } from "@noldova/context.parsers.typescript";
import { EnumMemberParser } from "@noldova/context.parsers.typescript/services/parsers/declarations/enum-member.parser.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class EnumMemberParserTests {
  @TestData("name = f(1, 2), next")
  @TestData('"name" = "text", next')
  @TestData("name, next")
  @TestMethod
  public stopsBeforeTheMemberSeparator(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = new EnumMemberParser(parser).parse();

    Assert.isInstanceOf(node, TypeScriptEnumMemberNode);
    Assert.areEqual(content.lastIndexOf(","), parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public retainsComputedNamesAsSyntaxAndReadsWhatTheyName(): void {
    const parser = TypeScriptParserFixture.create("[name] = 1,");
    const node = new EnumMemberParser(parser).parse();

    Assert.isInstanceOf(node, TypeScriptEnumMemberNode);
    Assert.isInstanceOf(node.nameNode, TypeScriptComputedPropertyNameNode);
    Assert.isDefined(node.initializerNode);
    Assert.areEqual("TS1164@0:6", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("A = ,")
  @TestData("A = }")
  @TestMethod
  public doesNotConsumeTheBoundaryOfAMissingInitializer(content: string): void {
    const parser = TypeScriptParserFixture.create(content);
    const node = new EnumMemberParser(parser).parse();

    Assert.isInstanceOf(node, TypeScriptEnumMemberNode);
    Assert.isInstanceOf(node.initializerNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(4, parser.currentNode.span.startOffset);
    Assert.areEqual(0, node.initializerNode.span.length);
    Assert.areEqual("TS1109@4:1", TypeScriptDiagnosticsFixture.project(parser.context.diagnosticCollector.diagnostics));
  }
}
