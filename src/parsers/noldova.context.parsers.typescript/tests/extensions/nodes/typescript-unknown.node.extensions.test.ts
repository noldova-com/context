/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptUnknownNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptUnknownNodeExtensionsTests {
  @TestMethod
  public startsNoStatement(): void {
    const parser = TypeScriptParserFixture.create("§");
    Assert.isInstanceOf(parser.currentNode, TypeScriptUnknownNode);

    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }
}
