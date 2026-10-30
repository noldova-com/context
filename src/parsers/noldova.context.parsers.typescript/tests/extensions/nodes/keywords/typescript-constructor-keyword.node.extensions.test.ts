/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptConstructorKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptConstructorKeywordNodeExtensionsTests {
  @TestMethod
  public recognizesAConstructorEvenWhenItsParameterListIsMissing(): void {
    const parser = TypeScriptParserFixture.create("constructor: Value;");
    Assert.isInstanceOf(parser.currentNode, TypeScriptConstructorKeywordNode);
    Assert.isTrue(parser.currentNode.isTypeScriptConstructorDeclarationStart(parser));
  }
}
