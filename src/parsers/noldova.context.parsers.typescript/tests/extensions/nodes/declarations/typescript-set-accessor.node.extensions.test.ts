/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptSetAccessorNode } from "@noldova/context.parsers.typescript";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";

@TestClass
export class TypeScriptSetAccessorNodeExtensionsTests {
  @TestData("class { set value<Type>(input: Type): void {} }", "TS1094", "value")
  @TestData("class { set value(): void {} }", "TS1049", "value")
  @TestData("class { set value(input: Type): void {} }", "TS1095", "value")
  @TestData("class { set value(...input: Type[]) {} }", "TS1053", "...")
  @TestData("class { set value(input?: Type) {} }", "TS1051", "?")
  @TestData("class { set value(input = initial) {} }", "TS1052", "value")
  @TestMethod
  public reportsTheFirstInvalidSignaturePart(content: string, expectedCode: string, expectedText: string): void {
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptSetAccessorNode);
    const context = new TypeScriptParserContext(new Source(content));

    node.validateTypeScriptGrammar(context);

    Assert.areEqual(1, context.diagnosticCollector.diagnostics.length);
    const diagnostic = context.diagnosticCollector.diagnostics[0];
    Assert.areEqual(expectedCode, diagnostic?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), diagnostic?.location?.start);
    Assert.areEqual(expectedText.length, diagnostic?.location?.length);
  }

  @TestMethod
  public acceptsASingleParameterSetter(): void {
    const content = "class { set value(input: Type) {} }";
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptSetAccessorNode);
    const context = new TypeScriptParserContext(new Source(content));

    node.validateTypeScriptGrammar(context);

    Assert.areEqual(0, context.diagnosticCollector.diagnostics.length);
  }
}
