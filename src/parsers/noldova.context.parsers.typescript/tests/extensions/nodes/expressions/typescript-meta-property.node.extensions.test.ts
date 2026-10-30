/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptMetaPropertyNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptMetaPropertyNodeExtensionsTests {
  @TestMethod
  public identifiesItsLeftHandSideGrammarForm(): void {
    const parser = TypeScriptParserFixture.create("import.meta");
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, TypeScriptMetaPropertyNode);
    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
