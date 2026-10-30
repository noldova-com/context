/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source } from "@noldova/context.parsers";
import { TypeScriptGetAccessorNode } from "@noldova/context.parsers.typescript";
import { TypeScriptParserContext } from "@noldova/context.parsers.typescript/models/typescript-parser-context.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ClassBodyParserFixture } from "../../../fixtures/class-body-parser.fixture.js";

@TestClass
export class TypeScriptGetAccessorNodeExtensionsTests {
  @TestData("class { get value<Type>(input: Type) {} }", "TS1094", "value")
  @TestData("class { get value(input: Type) {} }", "TS1054", "value")
  @TestData("class { get value(...: Type) {} }", "TS1054", "value")
  @TestMethod
  public reportsTheFirstInvalidSignaturePart(content: string, expectedCode: string, expectedText: string): void {
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptGetAccessorNode);
    const context = new TypeScriptParserContext(new Source(content));

    node.validateTypeScriptGrammar(context);

    Assert.areEqual(1, context.diagnosticCollector.diagnostics.length);
    const diagnostic = context.diagnosticCollector.diagnostics[0];
    Assert.areEqual(expectedCode, diagnostic?.code.displayText);
    Assert.areEqual(content.indexOf(expectedText), diagnostic?.location?.start);
    Assert.areEqual(expectedText.length, diagnostic?.location?.length);
  }

  @TestMethod
  public acceptsAParameterlessGetter(): void {
    const content = "class { get value() {} }";
    const node = ClassBodyParserFixture.parse(content).children[0];
    Assert.isInstanceOf(node, TypeScriptGetAccessorNode);
    const context = new TypeScriptParserContext(new Source(content));

    node.validateTypeScriptGrammar(context);

    Assert.areEqual(0, context.diagnosticCollector.diagnostics.length);
  }
}
