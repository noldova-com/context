/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptArrowFunctionNode, TypeScriptMissingIdentifierNode, TypeScriptParameterNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptParameterNodeExtensionsTests {
  @TestData("value", false)
  @TestData("value?", true)
  @TestData("value = fallback", false)
  @TestData("...values", false)
  @TestMethod
  public identifiesOptionalParametersForOrdering(content: string, expected: boolean): void {
    const node = TypeScriptParserFixture.create(`(${content}) => value`).parseExpression();
    Assert.isInstanceOf(node, TypeScriptArrowFunctionNode);
    Assert.isDefined(node.parameterListNode);
    const parameterNode = node.parameterListNode.children[0];
    Assert.isInstanceOf(parameterNode, TypeScriptParameterNode);

    Assert.areEqual(expected, parameterNode.isTypeScriptOptionalParameter());
  }

  @TestMethod
  public preservesAnAlreadyParsedParameter(): void {
    const node = new TypeScriptParameterNode([], new SourceSpan(0, 0), new TypeScriptMissingIdentifierNode(new SourceSpan(0, 0)));

    Assert.areEqual(node, node.toTypeScriptParameter());
  }

  @TestMethod
  public validatesARecoveredRestInitializerAtItsMissingName(): void {
    const parser = TypeScriptParserFixture.create("new (... = initial) => T");

    parser.parseType();

    Assert.areEqual("TS1048@8:0|TS2371@5:13", TypeScriptDiagnosticsFixture.project(TypeScriptGrammarFixture.getDiagnostics(parser)));
  }
}
