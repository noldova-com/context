/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptCloseBracketNodeExtensionsTests {
  @TestMethod
  public closesADelimiterAndStartsNoStatement(): void {
    const parser = TypeScriptParserFixture.create("]");

    Assert.isTrue(parser.currentNode.isTypeScriptClosingDelimiter());
    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }
}
