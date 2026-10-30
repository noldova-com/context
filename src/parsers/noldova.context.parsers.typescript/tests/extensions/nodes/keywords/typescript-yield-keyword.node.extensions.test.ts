/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptYieldKeywordNodeExtensionsTests {
  @TestData("yield", TypeScriptContextFlags.None, false)
  @TestData("yield value", TypeScriptContextFlags.None, true)
  @TestData("yield 1", TypeScriptContextFlags.None, true)
  @TestData("yield 1n", TypeScriptContextFlags.None, true)
  @TestData("yield 'value'", TypeScriptContextFlags.None, true)
  @TestData("yield true", TypeScriptContextFlags.None, true)
  @TestData("yield(value)", TypeScriptContextFlags.None, false)
  @TestData("yield\nvalue", TypeScriptContextFlags.None, false)
  @TestData("yield", TypeScriptContextFlags.Yield, true)
  @TestMethod
  public recognizesContextWithoutChangingTheParser(content: string, flags: TypeScriptContextFlags, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content, flags);
    const node = parser.currentNode;
    const offset = parser.typescriptLexer.reader.currentOffset;

    Assert.areEqual(expected, node.isTypeScriptYieldExpressionStart(parser));
    Assert.areEqual(node, parser.currentNode);
    Assert.areEqual(offset, parser.typescriptLexer.reader.currentOffset);
    Assert.areEqual(flags, parser.context.contextFlags);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public distinguishesBindingNamesFromExpressionIdentifiers(): void {
    const parser = TypeScriptParserFixture.create("yield");
    const node = parser.currentNode;

    Assert.isTrue(node.isTypeScriptBindingIdentifier());
    Assert.isTrue(node.isTypeScriptIdentifier(parser.context));
    parser.context.contextFlags = TypeScriptContextFlags.Yield;
    Assert.isFalse(node.isTypeScriptIdentifier(parser.context));
    Assert.isTrue(node.isTypeScriptBindingIdentifier());
  }
}
