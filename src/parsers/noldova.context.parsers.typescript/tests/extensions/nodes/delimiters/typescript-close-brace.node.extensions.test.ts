/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptCloseBraceNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptCloseBraceNodeExtensionsTests {
  @TestMethod
  public closesADelimiter(): void {
    Assert.isTrue(new TypeScriptCloseBraceNode(new SourceSpan(0, 1)).isTypeScriptClosingDelimiter());
  }

  @TestMethod
  public startsNoStatement(): void {
    const parser = TypeScriptParserFixture.create("}");

    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }
}
