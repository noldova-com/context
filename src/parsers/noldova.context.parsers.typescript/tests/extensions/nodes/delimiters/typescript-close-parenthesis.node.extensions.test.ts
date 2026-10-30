/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptCloseParenthesisNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptCloseParenthesisNodeExtensionsTests {
  @TestMethod
  public closesADelimiterAndStartsNoStatement(): void {
    const parser = TypeScriptParserFixture.create(")");

    Assert.isTrue(parser.currentNode.isTypeScriptClosingDelimiter());
    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }

  @TestMethod
  public canFollowAnOptionalParameterMarker(): void {
    Assert.isTrue(new TypeScriptCloseParenthesisNode(new SourceSpan(0, 1)).canFollowTypeScriptOptionalParameterMarker());
  }
}
