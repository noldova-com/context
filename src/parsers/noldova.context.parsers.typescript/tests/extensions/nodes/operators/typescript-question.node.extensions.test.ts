/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptQuestionNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptQuestionNodeExtensionsTests {
  @TestMethod
  public indicatesAFunctionTypeParameter(): void {
    Assert.isTrue(new TypeScriptQuestionNode(new SourceSpan(0, 1)).isTypeScriptFunctionTypeParameterIndicator());
  }

  @TestMethod
  public startsAType(): void {
    const parser = TypeScriptParserFixture.create("?");
    const node = parser.currentNode;
    Assert.isTrue(node.canStartTypeScriptType(parser));
  }

  @TestData("?: T", true)
  @TestData("?,", true)
  @TestData("?]", true)
  @TestData("? value", false)
  @TestMethod
  public distinguishesIndexSignatureSuffixesFromAConditionalExpression(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.isTypeScriptIndexSignatureParameterIndicator(parser));
    Assert.areEqual(0, parser.currentNode.span.startOffset);
  }

  @TestData("var o = { a?: 1 };", "TS1162@11:1")
  @TestData("var o = { a? };", "TS1162@11:1")
  @TestData("var o = { m?() {} };", "TS1162@11:1")
  @TestMethod
  public marksNoObjectLiteralMemberOptional(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
